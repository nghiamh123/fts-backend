import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    discountType: {
      type: String,
      enum: ["fixed", "percent"],
      default: "percent",
    },
    discountValue: { type: Number, default: 10 },
    minOrderAmount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    referrerReward: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Singleton helper — always upsert the single config doc
schema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({});
  }
  return config;
};

export const ReferralConfig = mongoose.model("ReferralConfig", schema);
