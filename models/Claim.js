const mongoose = require("mongoose");

const claimSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    claimNumber: { type: String, required: true, unique: true },
    // details: { type: mongoose.Schema.Types.Mixed }, // free-form claim details submitted by user
    status: {
      type: String,
      enum: ["awaiting_submission", "pending", "approved", "declined"],
      default: "awaiting_submission",
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    declineReason: { type: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Claim", claimSchema);
