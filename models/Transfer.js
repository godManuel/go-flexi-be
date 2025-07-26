// models/BankRequest.js
const mongoose = require("mongoose");

const transferSchema = new mongoose.Schema({
  public_key: String,
  amount: String,
  bank_code: String,
  bank_name: String,
  account_number: String,
  narration: String,
  name_enquiry_reference: String,
  SenderName: { type: String, default: null },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: { type: Date, default: Date.now },
});

const Transfer = mongoose.model("Transfer", transferSchema);

module.exports = Transfer;
