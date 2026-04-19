import mongoose from "mongoose";

const mediaAssetSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    url: { type: String, required: true },
    folder: { type: String, default: "media" },
    originalName: { type: String },
    customName: { type: String },
    size: { type: Number }, // bytes
    width: { type: Number },
    height: { type: Number },
  },
  { timestamps: true },
);

mediaAssetSchema.index({ folder: 1, createdAt: -1 });
mediaAssetSchema.index({ customName: "text", originalName: "text" });

export default mongoose.model("MediaAsset", mediaAssetSchema);
