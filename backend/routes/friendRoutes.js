import express from "express";
import protect from "../middleware/auth.js";
import {
  searchUsers,
  sendFriendRequest,
  respondFriendRequest,
  unfriend,
  getFriends,
} from "../controllers/friendController.js";

const router = express.Router();
router.use(protect);

router.get("/search", searchUsers);
router.get("/", getFriends);
router.post("/request/:targetId", sendFriendRequest);
router.post("/respond/:requesterId", respondFriendRequest);
router.delete("/:friendId", unfriend);

export default router;
