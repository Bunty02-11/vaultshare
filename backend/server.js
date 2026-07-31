import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { initSocket } from "./socket.js";

import authRoutes from "./routes/authRoutes.js";
import friendRoutes from "./routes/friendRoutes.js";
import assetRoutes from "./routes/assetRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import { resolveShortUrl } from "./controllers/assetController.js";

dotenv.config();

const startServer = async () => {
  await connectDB();

  const app = express();
  app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
  app.use(express.json());

  // Public URL shortener → CloudFront
  app.get("/s/:shortId", resolveShortUrl);

  app.use("/api/auth", authRoutes);
  app.use("/api/friends", friendRoutes);
  app.use("/api/assets", assetRoutes);
  app.use("/api/messages", messageRoutes);

  app.get("/", (req, res) => res.send("VaultShare API running"));

  const httpServer = http.createServer(app);
  initSocket(httpServer);

  const PORT = process.env.PORT || 8081;
  httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

startServer();
