const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    claim: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Claim",
      required: true,
    },

    amount: { type: Number, required: true, min: 2, max: 1000 },
    accountDetails: {
      bankName: String,
      accountNumber: String,
      accountName: String,
    },

    authCode: { type: String, required: true },
    authCodeUsed: { type: Boolean, default: false },
    authCodeExpiresAt: { type: Date, required: true },

    status: {
      type: String,
      enum: [
        "awaiting_confirmation", // auth code issued, not yet confirmed
        "confirmed", // auth code verified by user
        "funded", // admin has manually funded (Step 9)
        "expired",
        "cancelled",
      ],
      default: "awaiting_confirmation",
    },

    fundedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    fundedAt: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Withdrawal", withdrawalSchema);
