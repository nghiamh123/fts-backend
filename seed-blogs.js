import mongoose from "mongoose";
import "dotenv/config";
import BlogCategory from "./models/BlogCategory.js";
import Author from "./models/Author.js";
import Blog from "./models/Blog.js";

const MONGO_URL =
  process.env.MONGO_URI || "mongodb://localhost:27017/streetwear";

const seedData = async () => {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("Connected to MongoDB");

    // Clear existing
    await Blog.deleteMany({});
    await BlogCategory.deleteMany({});
    await Author.deleteMany({});

    // Create Authors
    const author1 = await Author.create({
      name: "Nghia Dang",
      bio: "Streetwear aficionado and lead designer at FTS.",
      avatar:
        "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
    });

    const author2 = await Author.create({
      name: "Streetwear Team",
      bio: "The official voice of FTS.",
      avatar:
        "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
    });

    // Create Categories
    const catEditorial = await BlogCategory.create({
      name: "Editorial",
      slug: "editorial",
    });
    const catLookbook = await BlogCategory.create({
      name: "Lookbook",
      slug: "lookbook",
    });
    const catNews = await BlogCategory.create({ name: "News", slug: "news" });

    // Create Blogs
    const blogs = [
      {
        title: "The Rise of Techwear in Urban Fashion",
        slug: "the-rise-of-techwear",
        excerpt:
          "How utility and function became the defining aesthetic for modern streetwear across the globe.",
        content:
          '<p>The evolution of modern streetwear has taken a functional pivot. Gone are the days when graphic tees alone defined the culture...</p><h3>Function Meets Form</h3><p>Today, waterproof zippers, Gore-Tex materials, and tactical silhouettes dominate the streets.</p><p><img src="https://images.unsplash.com/photo-1523398002811-999aa8e9ddaa?w=800&q=80" alt="techwear" /><br/></p><blockquote>"Fashion is what you buy, style is what you do with it. But utility is what makes it last."</blockquote><p>We see a strong influence from cyberpunk and military aesthetics bleeding into daily wear.</p>',
        thumbnail:
          "https://images.unsplash.com/photo-1523398002811-999aa8e9ddaa?w=800&q=80",
        categoryId: catEditorial._id,
        authorId: author1._id,
        status: "published",
        publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
      {
        title: "FTS Fall/Winter 2026 Collection",
        slug: "fts-fw26-collection",
        excerpt:
          "A first look at our upcoming Fall/Winter drop, featuring heavy knits, tactical outerwear and signature oversized hoodies.",
        content:
          "<h2>Embracing the Cold</h2><p>Our upcoming collection draws inspiration from dystopian cityscapes and brutalist architecture. We focused on heavy-weight fabrics that not only provide warmth but maintain an exaggerated silhouette.</p><p>The central piece of this collection is the <strong>NØRTH Oversized Parka</strong>, designed to withstand the harshest urban winters without compromising on style.</p>",
        thumbnail:
          "https://images.unsplash.com/photo-1550246140-5119ae4790b8?w=800&q=80",
        categoryId: catLookbook._id,
        authorId: author2._id,
        status: "published",
        publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      },
      {
        title: "Why Minimalist Aesthetics are Returning",
        slug: "why-minimalist-aesthetics-are-returning",
        excerpt:
          "After years of loud prints and massive logos, streetwear is quietly retreating back to essentials and subtle branding.",
        content:
          "<p>The trend cycle acts like a pendulum. We swung hard into logomania, and now we are swinging back. Quality of construction and fabric choice matter more than the print on the chest.</p>",
        thumbnail:
          "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80",
        categoryId: catEditorial._id,
        authorId: author1._id,
        status: "published",
        publishedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      },
      {
        title: "Draft: The Sneaker Resell Market in 2026",
        slug: "draft-sneaker-resell",
        excerpt: "Analyzing the bubble: Is it finally bursting?",
        content:
          "<p>This is a work in progress draft about sneaker culture.</p>",
        categoryId: catNews._id,
        authorId: author2._id,
        status: "draft",
      },
    ];

    for (const b of blogs) {
      await Blog.create(b);
    }

    console.log("Seed successful! Added categories, authors, and blogs.");
  } catch (error) {
    console.error("Seed error:", error);
  } finally {
    mongoose.connection.close();
  }
};

seedData();
