import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import { connectDb } from "./config/db.js";
import categories from "./routes/categories.js";
import products from "./routes/products.js";
import auth from "./routes/auth.js";
import cart from "./routes/cart.js";
import orders from "./routes/orders.js";
import affiliates from "./routes/affiliates.js";
import referrals from "./routes/referrals.js";
import adminCategories from "./routes/admin/categories.js";
import adminProducts from "./routes/admin/products.js";
import adminAuth from "./routes/admin/auth.js";
import adminUpload from "./routes/admin/upload.js";
import adminTemplates from "./routes/admin/templates.js";
import adminAuthors from "./routes/admin/authors.js";
import adminOrders from "./routes/admin/orders.js";
import adminBlogCategories from "./routes/admin/blog-categories.js";
import adminBlogs from "./routes/admin/blogs.js";
import adminTags from "./routes/admin/tags.js";
import adminAffiliates from "./routes/admin/affiliates.js";
import adminUsers from "./routes/admin/users.js";
import adminReferrals from "./routes/admin/referrals.js";
import adminStats from "./routes/admin/stats.js";
import adminEvents from "./routes/admin/events.js";
import adminBlogCrawl from "./routes/admin/blog-crawl.js";
import adminAiWriter from "./routes/admin/ai-writer.js";
import adminMedia from "./routes/admin/media.js";
import blogs from "./routes/blogs.js";
import events from "./routes/events.js";
import { requireAdminPermission } from "./middleware/requireAdmin.js";

const app = express();
const port = Number(process.env.PORT) || 4000;
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  }),
);
app.use(express.json());

app.use("/categories", categories);
app.use("/products", products);
app.use("/auth", auth);
app.use("/cart", cart);
app.use("/orders", orders);
app.use("/affiliates", affiliates);
app.use("/referrals", referrals);
app.use("/admin/auth", adminAuth);
app.use(
  "/admin/categories",
  requireAdminPermission("catalog:manage"),
  adminCategories,
);
app.use(
  "/admin/products",
  requireAdminPermission("catalog:manage"),
  adminProducts,
);
app.use(
  "/admin/orders",
  requireAdminPermission("orders:manage"),
  adminOrders,
);
app.use(
  "/admin/upload",
  requireAdminPermission("content:write"),
  adminUpload,
);
app.use(
  "/admin/templates",
  requireAdminPermission("catalog:manage"),
  adminTemplates,
);
app.use(
  "/admin/authors",
  requireAdminPermission("content:write"),
  adminAuthors,
);
app.use(
  "/admin/blog-categories",
  requireAdminPermission("content:write"),
  adminBlogCategories,
);
app.use("/admin/blogs", requireAdminPermission("content:write"), adminBlogs);
app.use("/admin/tags", requireAdminPermission("content:write"), adminTags);
app.use(
  "/admin/affiliates",
  requireAdminPermission("affiliates:manage"),
  adminAffiliates,
);
app.use(
  "/admin/referrals",
  requireAdminPermission("referrals:manage"),
  adminReferrals,
);
app.use("/admin/users", requireAdminPermission("users:manage"), adminUsers);
app.use("/admin/stats", requireAdminPermission("reports:view"), adminStats);
app.use(
  "/admin/events",
  requireAdminPermission("catalog:manage"),
  adminEvents,
);
app.use("/admin/blog-crawl", requireAdminPermission("ai:use"), adminBlogCrawl);
app.use("/admin/ai-writer", requireAdminPermission("ai:use"), adminAiWriter);
app.use("/admin/media", requireAdminPermission("content:write"), adminMedia);
app.use("/blogs", blogs);
app.use("/events", events);
app.use("/admin", express.static("admin"));

app.get("/health", (req, res) => res.json({ ok: true }));

app.use((err, _req, res, _next) => {
  if (err.message && err.message.includes("Chỉ chấp nhận")) {
    return res.status(400).json({ message: err.message });
  }
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "File tối đa 10MB" });
  }
  res.status(500).json({ message: err.message || "Internal error" });
});

connectDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`API running at http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("DB connection failed:", err);
    process.exit(1);
  });
