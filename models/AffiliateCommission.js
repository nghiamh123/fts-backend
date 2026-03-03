import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    affiliateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Affiliate",
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    orderNumber: String,
    amount: { type: Number, required: true },
    rate: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "paid", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true },
);

schema.index({ affiliateId: 1 });
schema.index({ orderId: 1 });
schema.index({ status: 1 });

export const AffiliateCommission = mongoose.model(
  "AffiliateCommission",
  schema,
);
