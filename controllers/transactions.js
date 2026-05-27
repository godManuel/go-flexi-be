const asyncHandler = require('../middlewares/async');
const Transfer = require('../models/Transfer');
const Deposit = require('../models/Deposit');

exports.getAllTransactions = asyncHandler(async (req, res, next) => {
  // Route middleware should ensure only admins reach here
  const transfers = await Transfer.find().populate('user', 'name email').lean();
  const deposits = await Deposit.find().populate('user', 'name email').lean();

  const mappedTransfers = transfers.map((t) => ({
    id: t._id,
    type: 'transfer',
    amount: t.amount,
    bank_name: t.bank_name,
    account_number: t.account_number,
    narration: t.narration,
    user: t.user,
    createdAt: t.createdAt,
  }));

  const mappedDeposits = deposits.map((d) => ({
    id: d._id,
    type: 'deposit',
    amount: d.transactionAmount || d.settledAmount || d.transactionAmount,
    accountNumber: d.accountNumber,
    sourceBankName: d.sourceBankName,
    user: d.user,
    createdAt: d.createdAt,
  }));

  const combined = mappedTransfers.concat(mappedDeposits);
  combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return res.status(200).json({ success: true, count: combined.length, data: combined });
});
