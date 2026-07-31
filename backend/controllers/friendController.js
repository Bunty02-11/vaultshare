import User from "../models/User.js";

export const searchUsers = async (req, res) => {
  const { q } = req.query;
  const query = q?.trim();

  if (!query) return res.json([]);

  const users = await User.find({
    $and: [
      { _id: { $ne: req.userId } },
      {
        $or: [
          { name: new RegExp(query, "i") },
          { email: new RegExp(query, "i") },
          { uniqueId: new RegExp(query, "i") },
        ],
      },
    ],
  }).select("name email avatar uniqueId");

  res.json(users);
};

export const sendFriendRequest = async (req, res) => {
  const { targetId } = req.params;
  if (targetId === req.userId) return res.status(400).json({ message: "Can't friend yourself" });

  const me = await User.findById(req.userId);
  const target = await User.findById(targetId);
  if (!target) return res.status(404).json({ message: "User not found" });

  if (me.friends.includes(targetId)) return res.status(400).json({ message: "Already friends" });
  if (me.friendRequestsSent.includes(targetId)) return res.status(400).json({ message: "Request already sent" });

  me.friendRequestsSent.push(targetId);
  target.friendRequestsReceived.push(req.userId);
  await me.save();
  await target.save();

  res.json({ message: "Friend request sent" });
};

export const respondFriendRequest = async (req, res) => {
  const { requesterId } = req.params;
  const { action } = req.body; // "accept" | "reject"

  const me = await User.findById(req.userId);
  const requester = await User.findById(requesterId);
  if (!requester) return res.status(404).json({ message: "User not found" });

  me.friendRequestsReceived = me.friendRequestsReceived.filter((id) => id.toString() !== requesterId);
  requester.friendRequestsSent = requester.friendRequestsSent.filter((id) => id.toString() !== req.userId);

  if (action === "accept") {
    me.friends.push(requesterId);
    requester.friends.push(req.userId);
  }

  await me.save();
  await requester.save();
  res.json({ message: `Friend request ${action}ed` });
};

export const unfriend = async (req, res) => {
  const { friendId } = req.params;
  if (friendId === req.userId) {
    return res.status(400).json({ message: "Can't unfriend yourself" });
  }

  const me = await User.findById(req.userId);
  const friend = await User.findById(friendId);
  if (!friend) return res.status(404).json({ message: "User not found" });

  const wereFriends =
    me.friends.some((id) => id.toString() === friendId) ||
    friend.friends.some((id) => id.toString() === req.userId);

  if (!wereFriends) {
    return res.status(400).json({ message: "You are not friends with this user" });
  }

  me.friends = me.friends.filter((id) => id.toString() !== friendId);
  friend.friends = friend.friends.filter((id) => id.toString() !== req.userId);

  // Clear any leftover pending requests both ways
  me.friendRequestsSent = me.friendRequestsSent.filter((id) => id.toString() !== friendId);
  me.friendRequestsReceived = me.friendRequestsReceived.filter((id) => id.toString() !== friendId);
  friend.friendRequestsSent = friend.friendRequestsSent.filter((id) => id.toString() !== req.userId);
  friend.friendRequestsReceived = friend.friendRequestsReceived.filter((id) => id.toString() !== req.userId);

  await me.save();
  await friend.save();

  res.json({ message: "Unfriended successfully" });
};

export const getFriends = async (req, res) => {
  const me = await User.findById(req.userId)
    .populate("friends", "name email avatar uniqueId")
    .populate("friendRequestsReceived", "name email avatar uniqueId")
    .populate("friendRequestsSent", "name email avatar uniqueId");
  res.json({
    friends: me.friends,
    received: me.friendRequestsReceived,
    sent: me.friendRequestsSent,
  });
};
