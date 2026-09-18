const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    documents: [
      {
        documentName: {
          type: String,
          enum: [
            "Signed Grant Acceptance Form",
            "Signed Grant Agreement",
            "Signed Beneficiary Declaration",
            "Signed Code of Conduct Agreement",
            "Signed Anti-Fraud Declaration",
            "Signed Conflict of Interest Declaration",
            "Business Registration Documents",
          ],
          required: true,
        },

        fileName: {
          type: String,
          required: true,
        },

        url: {
          type: String,
          required: true,
        },

        publicId: {
          type: String,
          required: true,
        },

        resourceType: {
          type: String,
          enum: ["image", "raw", "video"],
        },

        mimeType: String,

        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    reviewedAt: {
      type: Date,
    },

    rejectionReason: {
      type: String,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Application", applicationSchema);
