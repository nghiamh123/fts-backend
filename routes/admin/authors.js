import express from "express";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import Author from "../../models/Author.js";

const router = express.Router();

router.get("/", requireAdmin, async (req, res) => {
  try {
    const authors = await Author.find().sort({ createdAt: -1 });
    res.json(authors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const author = new Author(req.body);
    await author.save();
    res.status(201).json(author);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const author = await Author.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!author) return res.status(404).json({ message: "Author not found" });
    res.json(author);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const author = await Author.findByIdAndDelete(req.params.id);
    if (!author) return res.status(404).json({ message: "Author not found" });
    res.json({ message: "Author deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
