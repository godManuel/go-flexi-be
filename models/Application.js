const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    documents: [
      {
        fileName: String,
        url: String, // Cloudinary secure_url
        publicId: String, // Cloudinary public_id, needed for deletion
        resourceType: String, // "image" | "raw" | "video" as returned by Cloudinary
        mimeType: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    rejectionReason: { type: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Application", applicationSchema);
