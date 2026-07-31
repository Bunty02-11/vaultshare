import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const ensureUniqueId = async (user) => {
  if (user.uniqueId) return user;

  let candidate;
  do {
    candidate = `vs${Math.floor(100000 + Math.random() * 900000)}`;
  } while (await User.findOne({ uniqueId: candidate }));

  user.uniqueId = candidate;
  await user.save();
  return user;
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(400).json({ message: "Email already in use" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const userWithUniqueId = await ensureUniqueId(user);

    res.status(201).json({
      token: generateToken(userWithUniqueId._id),
      user: { id: userWithUniqueId._id, name: userWithUniqueId.name, email: userWithUniqueId.email, avatar: userWithUniqueId.avatar, uniqueId: userWithUniqueId.uniqueId },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const userWithUniqueId = await ensureUniqueId(user);

    res.json({
      token: generateToken(userWithUniqueId._id),
      user: { id: userWithUniqueId._id, name: userWithUniqueId.name, email: userWithUniqueId.email, avatar: userWithUniqueId.avatar, uniqueId: userWithUniqueId.uniqueId },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMe = async (req, res) => {
  const user = await User.findById(req.userId).select("-password");
  const userWithUniqueId = await ensureUniqueId(user);
  res.json({
    id: userWithUniqueId._id,
    name: userWithUniqueId.name,
    email: userWithUniqueId.email,
    avatar: userWithUniqueId.avatar,
    uniqueId: userWithUniqueId.uniqueId,
  });
};
