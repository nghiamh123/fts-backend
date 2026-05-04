import { Router } from "express";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import { User } from "../../models/User.js";
import { Affiliate } from "../../models/Affiliate.js";
import { hashPassword } from "../../utils/auth.js";

const router = Router();
router.use(requireAdmin);

// ─── List Users With Filters ───────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const rawSearch = (req.query.search || "").toString().trim();
    const role = (req.query.role || "").toString().trim();
    const affiliateFilter = (req.query.affiliate || "").toString().trim();

    const filter = {};

    if (role) {
      filter.role = role;
    }

    // Basic affiliate presence filters
    if (affiliateFilter === "has") {
      filter.affiliateId = { $ne: null };
    } else if (affiliateFilter === "none") {
      filter.affiliateId = { $in: [null], $exists: true };
    }

    if (rawSearch) {
      const regex = new RegExp(rawSearch, "i");
      filter.$or = [
        { fullName: { $regex: regex } },
        { email: { $regex: regex } },
        { phone: { $regex: regex } },
      ];
    }

    // Affiliate status-based filters (active / pending / suspended ...)
    if (
      affiliateFilter === "active" ||
      affiliateFilter === "pending" ||
      affiliateFilter === "suspended"
    ) {
      const affiliates = await Affiliate.find({ status: affiliateFilter })
        .select("_id")
        .lean();

      if (affiliates.length === 0) {
        return res.json({
          users: [],
          total: 0,
          page,
          totalPages: 0,
        });
      }

      const affiliateIds = affiliates.map((a) => a._id);
      filter.affiliateId = { $in: affiliateIds };
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("affiliateId")
        .lean(),
      User.countDocuments(filter),
    ]);

    res.json({
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { email, password, fullName, phone, role } = req.body || {};
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();
    const normalizedRole = String(role || "marketing").trim().toLowerCase();

    if (!normalizedEmail || !password || !fullName) {
      return res.status(400).json({
        message: "Email, password and fullName are required",
      });
    }

    if (String(password).length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    if (normalizedRole !== "marketing") {
      return res.status(400).json({
        message: "Only marketing accounts can be created from this screen",
      });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const user = await User.create({
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      fullName: String(fullName).trim(),
      phone: phone ? String(phone).trim() : undefined,
      role: normalizedRole,
    });

    res.status(201).json({
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        referralCode: user.referralCode,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

