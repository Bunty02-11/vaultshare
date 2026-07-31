import mongoose from "mongoose";
import generateShortId from "../utils/generateShortId.js";

const assetSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    s3Key: { type: String, required: true },
    shortId: {
      type: String,
      unique: true,
      sparse: true,
      default: () => generateShortId(7),
    },
    // legacy Cloudinary field — kept optional for old documents
    publicId: { type: String },
    fileType: { type: String },
    size: { type: Number },
    sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    downloadCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Asset", assetSchema);
