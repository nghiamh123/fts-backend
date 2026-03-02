import mongoose from "mongoose";

const blogCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("BlogCategory", blogCategorySchema);
