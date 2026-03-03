import express from "express";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import { Order } from "../../models/Order.js";

const router = express.Router();

router.get("/", requireAdmin, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) query.status = status;

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { "shippingAddress.phone": { $regex: search, $options: "i" } },
        { "shippingAddress.fullName": { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Order.countDocuments(query),
    ]);

    res.json({
      orders,
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
    const { id } = req.params;
    // Attempt to find by ObjectId or OrderNumber string
    let order = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(id);
    }

    if (!order) {
      order = await Order.findOne({ orderNumber: id });
    }

    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id/status", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Explicit list of allowed typical statuses.
    // You can adapt these text values based on locale preference or keep standard en strings.
    const allowedStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!status || !allowedStatuses.includes(status)) {
      return res
        .status(400)
        .json({ message: "Invalid status value provided." });
    }

    // Attempt to find by ObjectId or OrderNumber string
    let query = {};
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = id;
    } else {
      query.orderNumber = id;
    }

    const order = await Order.findOneAndUpdate(
      query,
      { status },
      { new: true },
    );

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json({ message: "Order status updated successfully", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
