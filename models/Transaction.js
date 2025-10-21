const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    amount: String,
    description: String,
    status: {
      type: String,
      enum: ["completed", "pending", "failed"],
      default: "completed",
    },
    type: {
      type: String,
      enum: ["deposit", "transfer", "airtime", "data", "credit", "debit"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    date: {
      type: String,
    },
    deposit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deposit",
    },
    transfer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transfer",
    },
    usdtrx: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "USDTrx",
    },
    balanceAfter: Number,
  },
  { timestamps: true }
);

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
