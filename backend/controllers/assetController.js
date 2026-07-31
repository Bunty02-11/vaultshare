import { randomUUID } from "crypto";
import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3, { bucket } from "../config/s3.js";
import Asset from "../models/Asset.js";
import User from "../models/User.js";

const MAX_SIZE = 25 * 1024 * 1024; // 25MB

const CLOUDFRONT_BASE =
  process.env.S3_PUBLIC_BASE_URL || "https://d2wlf8tghqd3rh.cloudfront.net";

const sanitizeFileName = (name = "file") =>
  name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 180);

/** Public CDN URL (CloudFront) for an S3 object key */
const publicUrlForKey = (key) =>
  `${CLOUDFRONT_BASE.replace(/\/$/, "")}/${key}`;

/** Short share link that redirects via /s/:shortId */
const shortUrlFor = (shortId, req) => {
  const base =
    process.env.API_PUBLIC_URL ||
    `${req.protocol}://${req.get("host")}`;
  return `${base.replace(/\/$/, "")}/s/${shortId}`;
};

/** Step 1: mint a pre-signed PUT URL so the browser uploads directly to S3 */
export const getPresignedUpload = async (req, res) => {
  try {
    const { fileName, fileType, size } = req.body;
    if (!fileName || !fileType) {
      return res.status(400).json({ message: "fileName and fileType are required" });
    }
    if (size && size > MAX_SIZE) {
      return res.status(400).json({ message: "File exceeds 25MB limit" });
    }

    const safeName = sanitizeFileName(fileName);
    const key = `vaultshare/${req.userId}/${randomUUID()}-${safeName}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 5 });

    res.json({
      uploadUrl,
      key,
      fileUrl: publicUrlForKey(key),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Step 2: after successful S3 PUT, persist asset metadata */
export const confirmUpload = async (req, res) => {
  try {
    const { key, fileName, fileType, size } = req.body;
    if (!key || !fileName) {
      return res.status(400).json({ message: "key and fileName are required" });
    }
    if (!key.startsWith(`vaultshare/${req.userId}/`)) {
      return res.status(403).json({ message: "Invalid upload key" });
    }
    if (size && size > MAX_SIZE) {
      return res.status(400).json({ message: "File exceeds 25MB limit" });
    }

    const fileUrl = publicUrlForKey(key);

    const asset = await Asset.create({
      owner: req.userId,
      fileName,
      fileUrl,
      s3Key: key,
      fileType,
      size,
    });

    const payload = asset.toObject();
    payload.shortUrl = shortUrlFor(asset.shortId, req);

    res.status(201).json(payload);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMyAssets = async (req, res) => {
  const owned = await Asset.find({ owner: req.userId }).populate("owner", "name email");
  const sharedWithMe = await Asset.find({ sharedWith: req.userId }).populate("owner", "name email");

  const withShort = (list) =>
    list.map((a) => {
      const obj = a.toObject();
      if (obj.shortId) obj.shortUrl = shortUrlFor(obj.shortId, req);
      return obj;
    });

  res.json({ owned: withShort(owned), sharedWithMe: withShort(sharedWithMe) });
};

export const shareAsset = async (req, res) => {
  const { assetId } = req.params;
  const { friendId } = req.body;

  const asset = await Asset.findById(assetId);
  if (!asset) return res.status(404).json({ message: "Asset not found" });
  if (asset.owner.toString() !== req.userId) return res.status(403).json({ message: "Not your asset" });

  const me = await User.findById(req.userId);
  if (!me.friends.includes(friendId)) return res.status(400).json({ message: "You can only share with friends" });

  if (!asset.sharedWith.includes(friendId)) {
    asset.sharedWith.push(friendId);
    await asset.save();
  }
  res.json(asset);
};

export const downloadAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.assetId);
    if (!asset) return res.status(404).json({ message: "Asset not found" });

    const isOwner = asset.owner.toString() === req.userId;
    const isShared = asset.sharedWith.map(String).includes(req.userId);
    if (!isOwner && !isShared) return res.status(403).json({ message: "Access denied" });

    const key = asset.s3Key || asset.publicId;
    if (!key) return res.status(500).json({ message: "Asset has no storage key" });

    asset.downloadCount += 1;
    await asset.save();

    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const downloadUrl = await getSignedUrl(s3, command, { expiresIn: 60 });

    res.json({ downloadUrl, fileName: asset.fileName, fileType: asset.fileType });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.assetId);
    if (!asset) return res.status(404).json({ message: "Asset not found" });
    if (asset.owner.toString() !== req.userId) return res.status(403).json({ message: "Not your asset" });

    const key = asset.s3Key || asset.publicId;
    if (key) {
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
      } catch (s3Err) {
        console.warn("S3 delete warning:", s3Err.message);
      }
    }

    await asset.deleteOne();
    res.json({ message: "Asset deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Public short-link redirect → CloudFront file URL */
export const resolveShortUrl = async (req, res) => {
  try {
    const asset = await Asset.findOne({ shortId: req.params.shortId });
    if (!asset) return res.status(404).json({ message: "Link not found" });

    asset.downloadCount += 1;
    await asset.save();

    return res.redirect(302, asset.fileUrl);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
