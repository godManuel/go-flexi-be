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
  response: mongoose.Schema.Types.Mixed, // to store API response
  createdAt: { type: Date, default: Date.now },
});

const Transfer = mongoose.model("Transfer", transferSchema);

module.exports = Transfer;
