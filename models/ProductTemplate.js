import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    sizeChart: { type: String, default: "" },
  },
  { timestamps: true },
);

export const ProductTemplate = mongoose.model("ProductTemplate", schema);
