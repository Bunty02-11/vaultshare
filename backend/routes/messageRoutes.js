import express from "express";
import protect from "../middleware/auth.js";
import {
  getOrCreateConversation,
  getMessages,
  getMyConversations,
  sendMessage,
  getUnreadSummary,
  markConversationRead,
} from "../controllers/messageController.js";

const router = express.Router();
router.use(protect);

router.get("/unread", getUnreadSummary);
router.get("/conversations", getMyConversations);
router.get("/conversations/:friendId/start", getOrCreateConversation);
router.post("/:conversationId/read", markConversationRead);
router.get("/:conversationId", getMessages);
router.post("/:conversationId", sendMessage);

export default router;
