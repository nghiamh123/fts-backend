import { Router } from "express";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import MediaAsset from "../../models/MediaAsset.js";
import { deleteR2Objects } from "../../config/cloudflare-r2.js";

const router = Router();
router.use(requireAdmin);

// GET /admin/media?folder=&search=&page=1&limit=30
router.get("/", async (req, res) => {
  try {
    const { folder, search, page = 1, limit = 30 } = req.query;
    const query = {};

    if (folder) query.folder = folder;
    if (search) {
      query.$or = [
        { customName: { $regex: search, $options: "i" } },
        { originalName: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [assets, total] = await Promise.all([
      MediaAsset.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      MediaAsset.countDocuments(query),
    ]);

    res.json({ assets, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /admin/media/folders — danh sách folder + count
router.get("/folders", async (req, res) => {
  try {
    const [folderNames, total] = await Promise.all([
      MediaAsset.distinct("folder"),
      MediaAsset.countDocuments(),
    ]);
    const counts = await Promise.all(
      folderNames.map(async (name) => ({
        name,
        count: await MediaAsset.countDocuments({ folder: name }),
      }))
    );
    res.json({ folders: counts.sort((a, b) => a.name.localeCompare(b.name)), total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /admin/media/:id
router.delete("/:id", async (req, res) => {
  try {
    const asset = await MediaAsset.findById(req.params.id);
    if (!asset) return res.status(404).json({ message: "Không tìm thấy ảnh" });

    await deleteR2Objects([asset.url]);
    await MediaAsset.deleteOne({ _id: asset._id });

    res.json({ message: "Đã xóa" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
