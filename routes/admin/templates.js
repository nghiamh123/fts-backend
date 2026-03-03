import { Router } from "express";
import { ProductTemplate } from "../../models/ProductTemplate.js";
import { requireAdmin } from "../../middleware/requireAdmin.js";

const router = Router();
router.use(requireAdmin);

router.get("/", async (req, res) => {
  try {
    const list = await ProductTemplate.find().sort({ createdAt: -1 }).lean();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, description, sizeChart } = req.body || {};
    if (!name) {
      return res.status(400).json({ message: "Tên mẫu (name) là bắt buộc" });
    }
    const template = await ProductTemplate.create({
      name: String(name).trim(),
      description: description?.trim() || "",
      sizeChart: sizeChart?.trim() || "",
    });
    res.status(201).json(template);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { name, description, sizeChart } = req.body || {};
    const updates = {};
    if (name !== undefined) updates.name = String(name).trim();
    if (description !== undefined)
      updates.description = String(description).trim();
    if (sizeChart !== undefined) updates.sizeChart = String(sizeChart).trim();

    const template = await ProductTemplate.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true,
      },
    ).lean();

    if (!template)
      return res.status(404).json({ message: "Template not found" });
    res.json(template);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const template = await ProductTemplate.findByIdAndDelete(req.params.id);
    if (!template)
      return res.status(404).json({ message: "Template not found" });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
