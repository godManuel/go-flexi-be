const asyncHandler = require("../middlewares/async");
const ErrorResponse = require("../utils/errorResponse");
const axios = require("axios");
const { bankCodes } = require("../config/bankCodes.js");
const Transfer = require("../models/Transfer.js");
const User = require("../models/User.js");
const { getReceiverAcctName } = require("../services/stroWalletService.js");

exports.bankTransfer = asyncHandler(async (req, res, next) => {
  const {
    amount,
    account_number,
    narration,
    name_enquiry_reference,
    SenderName,
    bank_name,
  } = req.query;

  // Validate required fields
  if (
    !amount ||
    !account_number ||
    !narration ||
    !name_enquiry_reference ||
    !bank_name
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Find bank code
  const matchedBank = bankCodes.find(
    (bank) =>
      bank.bankName.toLowerCase().trim() === bank_name.toLowerCase().trim()
  );
  if (!matchedBank) {
    return res
      .status(400)
      .json({ error: `Unsupported bank name: ${bank_name}` });
  }
  const bank_code = matchedBank.bankCode;

  // Prepare payload
  const payload = {
    public_key: process.env.STROWALLET_PUBLIC_KEY,
    amount,
    bank_code,
    account_number,
    narration,
    name_enquiry_reference,
  };
  if (SenderName) payload.SenderName = SenderName;

  // Validate user and balance
  let user;
  try {
    user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const transferAmount = Number(amount);
    const transferFee = Number(process.env.TRANSFER_FEE);
    const totalRequired = transferAmount + transferFee;

    if (user.accountBalance < 5000) {
      return next(new ErrorResponse("Insufficient Funds", 400));
    }

    if (user.accountBalance < totalRequired) {
      return res.status(400).json({ error: "Insufficient funds" });
    }

    if (user.isKYC !== "verified" && user.tier === "business") {
      return res.status(403).json({ error: "KYC verification required" });
    }
  } catch (err) {
    return res
      .status(500)
      .json({ error: "User lookup failed", details: err.message });
  }

  // Send request to StroWallet
  let resp;
  try {
    resp = await axios.post(
      "https://strowallet.com/api/banks/request/",
      payload,
      { headers: { accept: "application/json" } }
    );
  } catch (err) {
    const apiError = err.resp?.data || err.message;
    return res
      .status(502)
      .json({ error: "StroWallet request failed", details: apiError });
  }

  // Save to DB
  try {
    const transfer = await Transfer.create({
      ...payload,
      bank_name,
      user: req.user.id,
    });

    // Deduct totalRequired from user's accountBalance
    user.accountBalance -= totalRequired;
    const savedUser = await user.save();

    // Success resp
    return res
      .status(200)
      .json({ message: "Transfer completed", success: true, data: savedUser });
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Failed to save transfer", details: err.message });
  }
});

exports.checkAccountName = asyncHandler(async (req, res, next) => {
  const { account_number, bank_name } = req.query;

  // Validate required fields
  if (!account_number) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Find bank code
  const matchedBank = bankCodes.find(
    (bank) =>
      bank.bankName.toLowerCase().trim() === bank_name.toLowerCase().trim()
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
      return res.status(200).json({ success: true, data: result });
    }
  } catch (error) {
    console.error("Error checking account name:", error);
    return next(new ErrorResponse("Failed to check account name", 500));
  }
});
