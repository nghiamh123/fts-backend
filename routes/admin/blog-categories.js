import express from "express";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import BlogCategory from "../../models/BlogCategory.js";

const router = express.Router();

router.get("/", requireAdmin, async (req, res) => {
  try {
    const categories = await BlogCategory.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const category = new BlogCategory(req.body);
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Slug or Name already exists" });
    }
    res.status(400).json({ message: error.message });
  }
});

router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const category = await BlogCategory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );
    if (!category)
      return res.status(404).json({ message: "Category not found" });
    res.json(category);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Slug or Name already exists" });
    }
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const category = await BlogCategory.findByIdAndDelete(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });
    res.json({ message: "Category deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
