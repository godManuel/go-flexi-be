const mongoose = require("mongoose");

const personnelSchema = new mongoose.Schema({
  name: String,
  profileNumber: String,
  verificationCode: String,
  memberNumber: String,
});

const corporateBiz = new mongoose.Schema(
  {
    businessName: String,
    accountNumber: String,
    accountName: String,
    bankName: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["unverified", "verified", "declined", "pending"],
      default: "unverified",
    },
    cooperativeType: {
      type: String,
      enum: [
        "smedan",
        "cooperative-owner",
        "cooperative-member",
        "solo-cooperative",
      ],
    },
    corporativeName: String,
    certificateNumber: String,
    profileNumber: String,
    verificationCode: String,
    memberNumber: String,
    chairmanDetails: personnelSchema,
    secretaryDetails: personnelSchema,
  },
  { timestamps: true }
);

const CorporateBiz = mongoose.model("CorporateBiz", corporateBiz);

module.exports = CorporateBiz;
