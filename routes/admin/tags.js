import express from "express";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import Tag from "../../models/Tag.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const tags = await Tag.find().sort({ createdAt: -1 });
    res.json(tags);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    let { name, slug } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ message: "Name and slug are required" });
    }

    slug = slug
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const exist = await Tag.findOne({ slug });
    if (exist) {
      return res
        .status(400)
        .json({ message: "Tag with this slug already exists" });
    }

    const newTag = new Tag({ name, slug });
    await newTag.save();
    res.status(201).json(newTag);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const deleted = await Tag.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Not found" });
    // Note: We might want to remove this tag from all blogs too
    import("../../models/Blog.js").then(({ default: Blog }) => {
      Blog.updateMany(
        { tags: req.params.id },
        { $pull: { tags: req.params.id } },
      ).exec();
    });
    res.json({ message: "Tag deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
