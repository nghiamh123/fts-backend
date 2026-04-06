import express from "express";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import Blog from "../../models/Blog.js";
import { deleteR2Objects } from "../../config/cloudflare-r2.js";

const router = express.Router();

router.get("/", requireAdmin, async (req, res) => {
  try {
    const { status, categoryId, search, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (categoryId) query.categoryId = categoryId;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .populate("categoryId", "name slug")
        .populate("authorId", "name avatar")
        .populate("tags", "name slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Blog.countDocuments(query),
    ]);

    res.json({
      blogs,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", requireAdmin, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate("categoryId", "name slug")
      .populate("authorId", "name avatar")
      .populate("tags", "name slug");
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const blog = new Blog(req.body);
    if (blog.status === "published" && !blog.publishedAt) {
      blog.publishedAt = new Date();
    }
    await blog.save();
    res.status(201).json(blog);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Slug already exists" });
    }
    res.status(400).json({ message: error.message });
  }
});

router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    // Handle publishedAt
    if (
      req.body.status === "published" &&
      blog.status !== "published" &&
      !blog.publishedAt
    ) {
      req.body.publishedAt = new Date();
    }

    Object.assign(blog, req.body);
    await blog.save();

    res.json(blog);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Slug already exists" });
    }
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    // Collect images to delete from R2
    const imagesToDelete = [];
    if (blog.thumbnail) imagesToDelete.push(blog.thumbnail);
    if (blog.ogImage) imagesToDelete.push(blog.ogImage);
    if (blog.bannerImage) imagesToDelete.push(blog.bannerImage);

    if (blog.content) {
      // Regex cho ảnh Markdown cũ: ![alt](url)
      const mdImageRegex = /!\[.*?\]\((.*?)\)/g;
      let match;
      while ((match = mdImageRegex.exec(blog.content)) !== null) {
        imagesToDelete.push(match[1]);
      }

      // Regex cho ảnh HTML mới từ Quill: <img src="url">
      const htmlImageRegex = /<img[^>]+src=["']([^"']+)["']/gi;
      while ((match = htmlImageRegex.exec(blog.content)) !== null) {
        imagesToDelete.push(match[1]);
      }
    }

    // Chỉ xóa ảnh nằm trên R2 của mình (tránh xóa ảnh external)
    const r2BaseUrl = process.env.R2_PUBLIC_URL || "";
    const ownImages = r2BaseUrl
      ? imagesToDelete.filter((url) => url.startsWith(r2BaseUrl))
      : imagesToDelete;

    // Call S3 Batch Delete
    if (ownImages.length > 0) {
      await deleteR2Objects(ownImages);
    }

    // Finally delete document
    await Blog.deleteOne({ _id: blog._id });

    res.json({ message: "Blog deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
