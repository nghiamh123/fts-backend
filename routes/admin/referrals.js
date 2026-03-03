import { Router } from "express";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import { ReferralConfig } from "../../models/ReferralConfig.js";
import { ReferralUsage } from "../../models/ReferralUsage.js";

const router = Router();
router.use(requireAdmin);

// ─── Get Referral Config ────────────────────────────────────────────────────
router.get("/config", async (req, res) => {
  try {
    const config = await ReferralConfig.getConfig();
    res.json(config);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Update Referral Config ─────────────────────────────────────────────────
router.put("/config", async (req, res) => {
  try {
    const {
      discountType,
      discountValue,
      minOrderAmount,
      isActive,
      referrerReward,
    } = req.body || {};

    const config = await ReferralConfig.getConfig();

    if (discountType != null) config.discountType = discountType;
    if (discountValue != null) config.discountValue = discountValue;
    if (minOrderAmount != null) config.minOrderAmount = minOrderAmount;
    if (isActive != null) config.isActive = isActive;
    if (referrerReward != null) config.referrerReward = referrerReward;

    await config.save();
    res.json(config);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── View All Referral Usage ────────────────────────────────────────────────
router.get("/usage", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      ReferralUsage.find()
        .populate("referrerUserId", "fullName email referralCode")
        .populate("usedByUserId", "fullName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ReferralUsage.countDocuments(),
    ]);

    res.json({ items, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
