import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

export const getOrCreateConversation = async (req, res) => {
  const { friendId } = req.params;

  let convo = await Conversation.findOne({
    participants: { $all: [req.userId, friendId], $size: 2 },
  });

  if (!convo) {
    convo = await Conversation.create({ participants: [req.userId, friendId] });
  }
  res.json(convo);
};

export const getMessages = async (req, res) => {
  const { conversationId } = req.params;
  const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
  res.json(messages);
};

/** Unread message counts for the current user (messages sent by others) */
export const getUnreadSummary = async (req, res) => {
  const myId = new mongoose.Types.ObjectId(req.userId);
  const convos = await Conversation.find({ participants: myId }).select("_id participants");
  const convoIds = convos.map((c) => c._id);

  if (convoIds.length === 0) {
    return res.json({ total: 0, byConversation: {}, byFriend: {}, notifications: [] });
  }

  const unreadMessages = await Message.find({
    conversationId: { $in: convoIds },
    sender: { $ne: myId },
    read: false,
  })
    .sort({ createdAt: -1 })
    .populate("sender", "name email avatar");

  const byConversation = {};
  const byFriend = {};
  const latestByConvo = {};

  for (const msg of unreadMessages) {
    const convoId = String(msg.conversationId);
    const friendId = String(msg.sender._id || msg.sender);
    byConversation[convoId] = (byConversation[convoId] || 0) + 1;
    byFriend[friendId] = (byFriend[friendId] || 0) + 1;
    if (!latestByConvo[convoId]) {
      latestByConvo[convoId] = msg;
    }
  }

  const total = unreadMessages.length;
  const notifications = Object.values(latestByConvo).map((msg) => ({
    conversationId: msg.conversationId,
    count: byConversation[String(msg.conversationId)],
    text: msg.text,
    createdAt: msg.createdAt,
    sender: msg.sender
      ? {
          _id: msg.sender._id,
          name: msg.sender.name,
          email: msg.sender.email,
          avatar: msg.sender.avatar,
        }
      : null,
  }));

  res.json({ total, byConversation, byFriend, notifications });
};

/** Mark all messages from others in this conversation as read */
export const markConversationRead = async (req, res) => {
  const { conversationId } = req.params;
  const myId = new mongoose.Types.ObjectId(req.userId);

  const convo = await Conversation.findById(conversationId);
  if (!convo) return res.status(404).json({ message: "Conversation not found" });
  if (!convo.participants.map(String).includes(req.userId)) {
    return res.status(403).json({ message: "Access denied" });
  }

  await Message.updateMany(
    {
      conversationId,
      sender: { $ne: myId },
      read: false,
    },
    { $set: { read: true } }
  );

  res.json({ message: "Marked as read" });
};

export const getMyConversations = async (req, res) => {
  const convos = await Conversation.find({ participants: req.userId })
    .populate("participants", "name email avatar")
    .sort({ lastMessageAt: -1 });
  res.json(convos);
};

export const sendMessage = async (req, res) => {
  const { conversationId } = req.params;
  const { text } = req.body;

  const message = await Message.create({ conversationId, sender: req.userId, text });
  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: text,
    lastMessageAt: new Date(),
  });

  res.status(201).json(message);
};
