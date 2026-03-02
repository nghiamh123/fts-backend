import express from "express";
import Blog from "../models/Blog.js";
import BlogCategory from "../models/BlogCategory.js";
import Tag from "../models/Tag.js";

const router = express.Router();

router.get("/categories", async (req, res) => {
  try {
    const categories = await BlogCategory.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/tags", async (req, res) => {
  try {
    const tags = await Tag.find().sort({ name: 1 });
    res.json(tags);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const { category, tag, search, page = 1, limit = 9 } = req.query;
    const query = { status: "published" };

    if (category) {
      const cat = await BlogCategory.findOne({ slug: category });
      if (cat) query.categoryId = cat._id;
      else return res.json({ blogs: [], total: 0, page: 1, totalPages: 0 }); // No category found
    }

    if (tag) {
      const t = await Tag.findOne({ slug: tag });
      if (t) query.tags = t._id;
      else return res.json({ blogs: [], total: 0, page: 1, totalPages: 0 }); // No tag found
    }

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
        .sort({ publishedAt: -1, createdAt: -1 })
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

router.get("/:slug", async (req, res) => {
  try {
    const blog = await Blog.findOne({
      slug: req.params.slug,
      status: "published",
    })
      .populate("categoryId", "name slug")
      .populate("authorId", "name avatar bio")
      .populate("tags", "name slug");

    if (!blog) return res.status(404).json({ message: "Blog not found" });

    // Find related blogs: Algorithm -> Fallback
    // 1. Same Tags (if any exist on current post)
    // 2. Same Category
    // 3. Fallback to any latest
    let relatedQuery = { _id: { $ne: blog._id }, status: "published" };

    if (blog.tags && blog.tags.length > 0) {
      relatedQuery.tags = { $in: blog.tags.map((t) => t._id) };
    } else {
      relatedQuery.categoryId = blog.categoryId;
    }

    let relatedBlogs = await Blog.find(relatedQuery)
      .populate("categoryId", "name slug")
      .populate("tags", "name slug")
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(3);

    // If not enough tagged posts, backfill with same category
    if (relatedBlogs.length < 3) {
      const excludeIds = [blog._id, ...relatedBlogs.map((b) => b._id)];
      const categoryBackfill = await Blog.find({
        categoryId: blog.categoryId,
        _id: { $nin: excludeIds },
        status: "published",
      })
        .populate("categoryId", "name slug")
        .populate("tags", "name slug")
        .sort({ publishedAt: -1, createdAt: -1 })
        .limit(3 - relatedBlogs.length);

      relatedBlogs = [...relatedBlogs, ...categoryBackfill];
    }

    res.json({ blog, relatedBlogs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
