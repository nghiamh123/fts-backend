import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    referralCode: { type: String, required: true },
    referrerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    usedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    discountAmount: { type: Number, required: true },
    discountType: {
      type: String,
      enum: ["fixed", "percent"],
      default: "percent",
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
  },
  { timestamps: true },
);

schema.index({ referralCode: 1 });
schema.index({ usedByUserId: 1 });
schema.index({ orderId: 1 });

export const ReferralUsage = mongoose.model("ReferralUsage", schema);
