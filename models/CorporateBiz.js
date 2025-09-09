const mongoose = require("mongoose");

const corporateBiz = new mongoose.Schema(
  {
    businessName: String,
    accountNumber: String,
    accountName: String,
    bankName: String,
    image: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["unverified", "verified", "declined"],
      default: "unverified",
    },
  },
  { timestamps: true }
);

const CorporateBiz = mongoose.model("CorporateBiz", corporateBiz);

module.exports = CorporateBiz;
