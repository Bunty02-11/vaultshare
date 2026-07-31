import express from "express";
import protect from "../middleware/auth.js";
import {
  getPresignedUpload,
  confirmUpload,
  getMyAssets,
  shareAsset,
  downloadAsset,
  deleteAsset,
} from "../controllers/assetController.js";

const router = express.Router();
router.use(protect);

router.post("/presign", getPresignedUpload);
router.post("/confirm", confirmUpload);
router.get("/", getMyAssets);
router.post("/:assetId/share", shareAsset);
router.get("/:assetId/download", downloadAsset);
router.delete("/:assetId", deleteAsset);

export default router;
