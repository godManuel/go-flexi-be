const asyncHandler = require("../middlewares/async");
const ErrorResponse = require("../utils/errorResponse");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Transfer = require("../models/Transfer");
const Deposit = require("../models/Deposit");
const UsdTrx = require("../models/USDTrx");

exports.getAllTransactions = asyncHandler(async (req, res, next) => {
  // Route middleware should ensure only admins reach here
  const transfers = await Transfer.find().populate("user", "name email").lean();
  const deposits = await Deposit.find().populate("user", "name email").lean();

  const mappedTransfers = transfers.map((t) => ({
    id: t._id,
    type: "transfer",
    amount: t.amount,
    bank_name: t.bank_name,
    account_number: t.account_number,
    narration: t.narration,
    user: t.user,
    createdAt: t.createdAt,
  }));

  const mappedDeposits = deposits.map((d) => ({
    id: d._id,
    type: "deposit",
    amount: d.transactionAmount || d.settledAmount || d.transactionAmount,
    accountNumber: d.accountNumber,
    sourceBankName: d.sourceBankName,
    user: d.user,
    createdAt: d.createdAt,
  }));

  const combined = mappedTransfers.concat(mappedDeposits);
  combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return res
    .status(200)
    .json({ success: true, count: combined.length, data: combined });
});

exports.getUserTransactions = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  const user = await User.findById(userId).select("-password");
  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }

  if (req.user.role !== "admin" && req.user.id !== userId) {
    return next(
      new ErrorResponse("Not allowed to access this user's transactions", 403),
    );
  }

  const [deposits, transfers, usdTrxs, otherTransactions] = await Promise.all([
    Deposit.find({ user: userId }).lean(),
    Transfer.find({ user: userId }).lean(),
    UsdTrx.find({ user: userId }).lean(),
    Transaction.find({
      user: userId,
      type: { $in: ["data", "airtime", "credit", "debit"] },
    }).lean(),
  ]);

  const formattedDeposits = deposits.map((d) => ({
    id: d._id,
    type: "deposit",
    amount: d.transactionAmount || d.settledAmount || d.amount,
    accountNumber: d.accountNumber,
    sourceBankName: d.sourceBankName,
    createdAt: d.createdAt,
  }));

  const formattedTransfers = transfers.map((t) => ({
    id: t._id,
    type: "transfer",
    amount: t.amount,
    to: t.to,
    narration: t.narration || t.description,
    createdAt: t.createdAt,
  }));

  const formattedUsdTrxs = usdTrxs.map((u) => ({
    id: u._id,
    type: "usd_transaction",
    amount: u.amount,
    currency: u.currency || "USD",
    description: u.message || u.description || "USD transaction",
    createdAt: u.createdAt,
  }));

  const formattedTransactions = otherTransactions.map((t) => ({
    id: t._id,
    type: t.type,
    amount: t.amount,
    status: t.status,
    description: t.description || `${t.type} transaction`,
    createdAt: t.createdAt,
  }));

  const transactions = [
    ...formattedDeposits,
    ...formattedTransfers,
    ...formattedUsdTrxs,
    ...formattedTransactions,
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return res
    .status(200)
    .json({
      success: true,
      user,
      count: transactions.length,
      data: transactions,
    });
});
