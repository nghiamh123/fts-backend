import { Router } from "express";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import { Affiliate } from "../../models/Affiliate.js";
import { AffiliateCommission } from "../../models/AffiliateCommission.js";
import { WalletTransaction } from "../../models/WalletTransaction.js";
import { User } from "../../models/User.js";

const router = Router();
router.use(requireAdmin);

// ─── List All Affiliates ────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const status = req.query.status; // optional filter

    const filter = status ? { status } : {};

    const [items, total] = await Promise.all([
      Affiliate.find(filter)
        .populate("userId", "fullName email phone referralCode")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Affiliate.countDocuments(filter),
    ]);

    res.json({ items, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Approve Affiliate ──────────────────────────────────────────────────────
router.patch("/:id/approve", async (req, res) => {
  try {
    const affiliate = await Affiliate.findByIdAndUpdate(
      req.params.id,
      { status: "active" },
      { new: true },
    ).populate("userId", "fullName email");

    if (!affiliate)
      return res.status(404).json({ message: "Affiliate not found" });
    res.json(affiliate);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Suspend Affiliate ──────────────────────────────────────────────────────
router.patch("/:id/suspend", async (req, res) => {
  try {
    const affiliate = await Affiliate.findByIdAndUpdate(
      req.params.id,
      { status: "suspended" },
      { new: true },
    ).populate("userId", "fullName email");

    if (!affiliate)
      return res.status(404).json({ message: "Affiliate not found" });
    res.json(affiliate);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Set Commission Rate ────────────────────────────────────────────────────
router.patch("/:id/commission-rate", async (req, res) => {
  try {
    const { commissionRate } = req.body || {};
    if (commissionRate == null || commissionRate < 0 || commissionRate > 100) {
      return res.status(400).json({ message: "Commission rate must be 0-100" });
    }

    const affiliate = await Affiliate.findByIdAndUpdate(
      req.params.id,
      { commissionRate },
      { new: true },
    ).populate("userId", "fullName email");

    if (!affiliate)
      return res.status(404).json({ message: "Affiliate not found" });
    res.json(affiliate);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── View All Commissions ───────────────────────────────────────────────────
router.get("/commissions", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      AffiliateCommission.find()
        .populate({
          path: "affiliateId",
          populate: { path: "userId", select: "fullName email" },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AffiliateCommission.countDocuments(),
    ]);

    res.json({ items, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── View All Withdrawal Requests ───────────────────────────────────────────
router.get("/withdrawals", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const filter = { type: "withdrawal" };
    if (status) filter.status = status;

    const [items, total] = await Promise.all([
      WalletTransaction.find(filter)
        .populate({
          path: "affiliateId",
          populate: { path: "userId", select: "fullName email phone" },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      WalletTransaction.countDocuments(filter),
    ]);

    res.json({ items, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Approve Withdrawal ────────────────────────────────────────────────────
router.patch("/withdrawals/:id/approve", async (req, res) => {
  try {
    const tx = await WalletTransaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ message: "Transaction not found" });
    if (tx.type !== "withdrawal" || tx.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Can only approve pending withdrawals" });
    }

    tx.status = "completed";
    await tx.save();

    res.json(tx);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Reject Withdrawal ─────────────────────────────────────────────────────
router.patch("/withdrawals/:id/reject", async (req, res) => {
  try {
    const tx = await WalletTransaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ message: "Transaction not found" });
    if (tx.type !== "withdrawal" || tx.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Can only reject pending withdrawals" });
    }

    // Refund the amount back to the affiliate wallet
    await Affiliate.findByIdAndUpdate(tx.affiliateId, {
      $inc: { walletBalance: tx.amount },
    });

    tx.status = "rejected";
    tx.note = req.body?.note || "Rejected by admin";
    await tx.save();

    res.json(tx);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
