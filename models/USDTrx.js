const mongoose = require("mongoose");

const usdTrxSchema = new mongoose.Schema(
  {
    message: String,
    reference: String,
    address: String,
    amount: String,
    charge: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const UsdTrx = mongoose.model("UsdTrx", usdTrxSchema);

module.exports = UsdTrx;
