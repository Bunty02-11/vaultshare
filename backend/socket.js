import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Message from "./models/Message.js";
import Conversation from "./models/Conversation.js";
import User from "./models/User.js";

// userId -> socketId
const onlineUsers = new Map();

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL, credentials: true },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    onlineUsers.set(socket.userId, socket.id);
    // Personal room so we can notify even when user is not in a chat room
    socket.join(`user:${socket.userId}`);
    io.emit("presence:update", Array.from(onlineUsers.keys()));

    socket.on("chat:join", (conversationId) => {
      socket.join(conversationId);
    });

    socket.on("chat:message", async ({ conversationId, text }) => {
      if (!text?.trim() || !conversationId) return;

      const convo = await Conversation.findById(conversationId);
      if (!convo) return;

      const isParticipant = convo.participants.some(
        (p) => p.toString() === socket.userId
      );
      if (!isParticipant) return;

      const message = await Message.create({
        conversationId,
        sender: socket.userId,
        text: text.trim(),
      });

      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: text.trim(),
        lastMessageAt: new Date(),
      });

      const payload = message.toObject();
      // Live update for anyone currently in the conversation room
      io.to(conversationId).emit("chat:message", payload);

      // Notify the other participant even if they are on another page
      const recipientId = convo.participants
        .map(String)
        .find((id) => id !== socket.userId);

      if (recipientId) {
        const sender = await User.findById(socket.userId).select("name email avatar");
        io.to(`user:${recipientId}`).emit("chat:notify", {
          message: payload,
          conversationId,
          sender: {
            _id: sender._id,
            name: sender.name,
            email: sender.email,
            avatar: sender.avatar,
          },
        });
      }
    });

    socket.on("chat:typing", ({ conversationId, isTyping }) => {
      socket.to(conversationId).emit("chat:typing", {
        userId: socket.userId,
        isTyping,
      });
    });

    socket.on("disconnect", () => {
      onlineUsers.delete(socket.userId);
      io.emit("presence:update", Array.from(onlineUsers.keys()));
    });
  });

  return io;
};
