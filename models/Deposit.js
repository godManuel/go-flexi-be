const mongoose = require("mongoose");

const depositSchema = new mongoose.Schema({
  sessionId: String,
  accountNumber: String,
  tranRemarks: String,
  transactionAmount: String,
  settledAmount: String,
  feeAmount: String,
  vatAmount: String,
  currency: String,
  initiationTranRef: String,
  settlementId: String,
  sourceAccountNumber: String,
  sourceAccountName: String,
  sourceBankName: String,
  channelId: String,
  tranDateTime: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const Deposit = mongoose.model("Deposit", depositSchema);

module.exports = Deposit;
