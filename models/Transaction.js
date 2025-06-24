const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    amount: String,
    description: String,
    date: String,
    status: {
      type: String,
      enum: ["completed", "pending", "failed"],
    },
    type: {
      type: String,
      enum: ["deposit", "transfer"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deposit",
    },
  },
  { timestamps: true }
);

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
