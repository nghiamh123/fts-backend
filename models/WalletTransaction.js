import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    affiliateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Affiliate",
      required: true,
    },
    amount: { type: Number, required: true },
    type: {
      type: String,
      enum: ["commission", "withdrawal"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "rejected"],
      default: "pending",
    },
    note: String,
  },
  { timestamps: true },
);

schema.index({ affiliateId: 1 });
schema.index({ type: 1 });
schema.index({ status: 1 });

export const WalletTransaction = mongoose.model("WalletTransaction", schema);
