import mongoose from "mongoose";

const generateUniqueId = async () => {
  const prefix = "vs";
  while (true) {
    const candidate = `${prefix}${Math.floor(100000 + Math.random() * 900000)}`;
    const existing = await mongoose.models.User.findOne({ uniqueId: candidate });
    if (!existing) return candidate;
  }
};

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    avatar: { type: String, default: "" },
    uniqueId: { type: String, required: true, unique: true, trim: true, lowercase: true },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    friendRequestsSent: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    friendRequestsReceived: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

userSchema.pre("validate", async function (next) {
  if (!this.uniqueId) {
    this.uniqueId = await generateUniqueId();
  }
  next();
});

export default mongoose.model("User", userSchema);
