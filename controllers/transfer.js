const asyncHandler = require("../middlewares/async");
const ErrorResponse = require("../utils/errorResponse");
const axios = require("axios");
const { bankCodes } = require("../config/bankCodes.js");
const Transfer = require("../models/Transfer.js");
const User = require("../models/User.js");
const Transaction = require("../models/Transaction.js");
const { getReceiverAcctName } = require("../services/stroWalletService.js");
const { enforceTransferLimits } = require("../utils/enforceTransferLimits.js");

exports.bankTransfer = asyncHandler(async (req, res, next) => {
  try {
    const {
      amount,
      account_number,
      narration,
      name_enquiry_reference,
      SenderName,
      bank_name,
    } = req.query;

    // =========================
    // Find bank code
    // =========================
    const matchedBank = bankCodes.find(
      (bank) =>
        bank.bankName.toLowerCase().trim() === bank_name.toLowerCase().trim(),
    );

    if (!matchedBank) {
      return res
        .status(400)
        .json({ error: `Unsupported bank name: ${bank_name}` });
    }

    const bank_code = matchedBank.bankCode;

    // =========================
    // Prepare payload
    // =========================
    const payload = {
      public_key: process.env.STROWALLET_PUBLIC_KEY,
      amount,
      bank_code,
      account_number,
      narration,
      name_enquiry_reference,
    };

    if (SenderName) payload.SenderName = SenderName;

    // =========================
    // Validate user
    // =========================
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const transferAmount = Number(amount);
    const transferFee = Number(process.env.TRANSFER_FEE);
    const totalRequired = transferAmount + transferFee;

    // =========================
    // Balance checks
    // =========================
    if (user.accountBalance <= 5000) {
      return res.status(400).json({ error: "Insufficient Funds" });
    }

    if (user.accountBalance < totalRequired) {
      return res.status(400).json({ error: "Insufficient funds" });
    }

    if (user.accountBalance - totalRequired < 5000) {
      return next(new ErrorResponse("Insufficient Funds after deduction", 400));
    }

    if (user.isKYC !== "verified" && user.tier === "business") {
      return res.status(403).json({ error: "KYC verification required" });
    }

    // Tier transfer limits
    await enforceTransferLimits(user._id, transferAmount);

    // =========================
    // Call StroWallet API
    // =========================
    const respon = await axios.post(
      "https://strowallet.com/api/banks/request/",
      payload,
      { headers: { accept: "application/json" } },
    );

    // =========================
    // Save transfer record
    // =========================
    const transfer = await Transfer.create({
      ...payload,
      bank_name,
      user: req.user.id,
    });

    await transfer.save();

    // =========================
    // Deduct balance
    // =========================
    user.accountBalance -= totalRequired;
    const savedUser = await user.save();

    // =========================
    // Save transaction record
    // =========================
    await Transaction.create({
      user: user._id,
      amount: transferAmount,
      type: "transfer",
      description: `Transfer to ${bank_name} - ${account_number} (${
        narration || "Funds transfer"
      })`,
      transfer: transfer._id,
      balanceAfter: user.accountBalance,
    });

    // =========================
    // Success response
    // =========================
    return res.status(200).json({
      message: "Transfer completed",
      success: true,
      data: savedUser,
      stroWalletResponse: respon.data,
    });
  } catch (err) {
    let details = err.response?.data || err.message;

    return res.status(500).json({
      error: "Bank transfer failed",
      details,
    });
  }
});

exports.adminBankTransfer = asyncHandler(async (req, res, next) => {
  try {
    const {
      amount,
      account_number,
      narration,
      name_enquiry_reference,
      SenderName,
      bank_name,
      userId, // Admin specifies which user balance to debit
    } = req.body;

    /* =========================
       Verify Admin Access
    ========================== */
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    /* =========================
       Find Bank Code
    ========================== */
    const matchedBank = bankCodes.find(
      (bank) =>
        bank.bankName.toLowerCase().trim() === bank_name.toLowerCase().trim(),
    );

    if (!matchedBank) {
      return res
        .status(400)
        .json({ error: `Unsupported bank name: ${bank_name}` });
    }

    const bank_code = matchedBank.bankCode;

    /* =========================
       Prepare Payload
    ========================== */
    const payload = {
      public_key: process.env.STROWALLET_PUBLIC_KEY,
      amount,
      bank_code,
      account_number,
      narration,
      name_enquiry_reference,
    };

    if (SenderName) payload.SenderName = SenderName;

    /* =========================
       Find Target User
    ========================== */
    const user = await User.findById(req.user.id);

    const transferAmount = Number(amount);
    const transferFee = Number(process.env.TRANSFER_FEE || 0);
    const totalRequired = transferAmount + transferFee;

    /* =========================
       Simple Balance Check (Only ensure enough funds)
    ========================== */
    if (user.accountBalance < totalRequired) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    /* =========================
       Call StroWallet API
    ========================== */
    const respon = await axios.post(
      "https://strowallet.com/api/banks/request/",
      payload,
      { headers: { accept: "application/json" } },
    );

    /* =========================
       Save Transfer Record
    ========================== */
    const transfer = await Transfer.create({
      ...payload,
      bank_name,
      user: req.user.id,
    });

    /* =========================
       Deduct Balance
    ========================== */
    user.accountBalance -= totalRequired;
    const savedUser = await user.save();

    /* =========================
       Save Transaction Record
    ========================== */
    await Transaction.create({
      user: user._id,
      amount: transferAmount,
      type: "transfer",
      description: `Admin withdrawal to ${bank_name} - ${account_number}`,
      transfer: transfer._id,
      balanceAfter: user.accountBalance,
      performedBy: req.user._id,
    });

    /* =========================
       Success Response
    ========================== */
    return res.status(200).json({
      message: "Admin transfer completed successfully",
      success: true,
      data: savedUser,
      stroWalletResponse: respon.data,
    });
  } catch (err) {
    let details = err.response?.data || err.message;

    return res.status(500).json({
      error: "Admin bank transfer failed",
      details,
    });
  }
});

exports.checkAccountName = asyncHandler(async (req, res, next) => {
  const { account_number, bank_name } = req.query;

  if (!account_number || !bank_name) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const matchedBank = bankCodes.find(
    (bank) =>
      bank.bankName.toLowerCase().trim() === bank_name.toLowerCase().trim(),
  );

  if (!matchedBank) {
    return res
      .status(400)
      .json({ error: `Unsupported bank name: ${bank_name}` });
  }

  const bank_code = matchedBank.bankCode;

  try {
    const result = await getReceiverAcctName({
      account_number,
      bank_code,
    });

    if (result) {
      return res.status(200).json({
        success: true,
        data: result,
      });
    }
  } catch (error) {
    console.error("Error checking account name:", error);
    return next(new ErrorResponse("Failed to check account name", 500));
  }
});
