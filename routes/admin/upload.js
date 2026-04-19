import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import {
  r2Client,
  R2_BUCKET,
  isR2Configured,
  getPublicUrl,
} from "../../config/cloudflare-r2.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import MediaAsset from "../../models/MediaAsset.js";

const router = Router();
router.use(requireAdmin);

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/tiff",
  "image/bmp",
];
const MAX_SIZE = 20 * 1024 * 1024; // 20 MB raw input

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) return cb(null, true);
    cb(new Error("Chỉ chấp nhận ảnh: JPEG, PNG, GIF, WebP, AVIF, TIFF, BMP"), false);
  },
});

function slugifyName(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * POST /admin/upload
 * Query params:
 *   folder      — thư mục lưu: products | blogs | media | ... (default: media)
 *   customName  — tên file tuỳ chọn (sẽ slugify); nếu bỏ trống dùng tên gốc
 *   maxWidth    — resize xuống maxWidth px (giữ tỉ lệ); 0 = không resize
 *   crop        — JSON string {"x":0,"y":0,"w":800,"h":600} (pixels trên ảnh gốc)
 */
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!isR2Configured()) {
      return res.status(503).json({ message: "Cloudflare R2 chưa cấu hình" });
    }
    if (!req.file?.buffer) {
      return res.status(400).json({ message: "Gửi file với field name 'file' (multipart/form-data)" });
    }

    const folder = (req.query.folder || "media").replace(/[^a-zA-Z0-9_-]/g, "");
    const maxWidth = parseInt(req.query.maxWidth) || 0;
    const rawCustomName = (req.query.customName || "").trim();
    const originalName = req.file.originalname.replace(/\.[^.]+$/, "");

    // Parse crop param
    let cropRect = null;
    if (req.query.crop) {
      try {
        const c = JSON.parse(req.query.crop);
        if (c.w > 0 && c.h > 0) {
          cropRect = { left: Math.round(c.x), top: Math.round(c.y), width: Math.round(c.w), height: Math.round(c.h) };
        }
      } catch {}
    }

    // ── Sharp pipeline ──
    let pipeline = sharp(req.file.buffer);

    // 1. Crop (before resize so pixel coords match original)
    if (cropRect) {
      pipeline = pipeline.extract(cropRect);
    }

    // 2. Resize (maintain aspect ratio)
    if (maxWidth > 0) {
      pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true });
    }

    // 3. Convert to WebP
    pipeline = pipeline.webp({ quality: 85 });

    const outputBuffer = await pipeline.toBuffer({ resolveWithObject: true });
    const { data, info } = outputBuffer;

    // ── Build filename ──
    const baseName = rawCustomName ? slugifyName(rawCustomName) : slugifyName(originalName);
    const uniqueSuffix = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const filename = `${baseName}-${uniqueSuffix}.webp`;
    const key = `${folder}/${filename}`;

    // ── Upload to R2 ──
    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: data,
        ContentType: "image/webp",
      }),
    );

    const url = getPublicUrl(key);
    if (!url) {
      return res.status(500).json({ message: "CLOUDFLARE_R2_PUBLIC_URL chưa cấu hình" });
    }

    // ── Save to MediaAsset ──
    const asset = await MediaAsset.create({
      key,
      url,
      folder,
      originalName: req.file.originalname,
      customName: rawCustomName || baseName,
      size: data.length,
      width: info.width,
      height: info.height,
    });

    res.status(201).json({
      url,
      key,
      assetId: asset._id,
      width: info.width,
      height: info.height,
      size: data.length,
    });
  } catch (err) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File tối đa 20MB" });
    }
    if (err.message?.includes("Chỉ chấp nhận")) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: err.message || "Upload thất bại" });
  }
});

export default router;
