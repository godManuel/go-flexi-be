const asyncHandler = require("../middlewares/async");
const ErrorResponse = require("../utils/errorResponse");
const axios = require("axios");
const { bankCodes } = require("../config/bankCodes.js");
const Transfer = require("../models/Transfer.js");
const User = require("../models/User.js");
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
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const transferAmount = Number(amount);
    const transferFee = Number(process.env.TRANSFER_FEE);
    const totalRequired = transferAmount + transferFee;

    if (user.accountBalance < 5000) {
      return res.status(400).json({ error: "Insufficient Funds" });
    }

    if (user.accountBalance < totalRequired) {
      return res.status(400).json({ error: "Insufficient funds" });
    }

    if (user.isKYC !== "verified" && user.tier === "business") {
      return res.status(403).json({ error: "KYC verification required" });
    }

    await enforceTransferLimits(user._id, transferAmount);

    // Send request to StroWallet
    const respon = await axios.post(
      "https://strowallet.com/api/banks/request/",
      payload,
      { headers: { accept: "application/json" } }
    );

    // Save to DB
    const transfer = await Transfer.create({
      ...payload,
      bank_name,
      user: req.user.id,
    });

    await transfer.save()

    // Deduct totalRequired from user's accountBalance
    user.accountBalance -= totalRequired;
    const savedUser = await user.save();

    // Success response
    return res
      .status(200)
      .json({ message: "Transfer completed", success: true, data: savedUser });
  } catch (err) {
    // Handle errors from any step
    let details = err.response?.data || err.message;
    return res.status(500).json({ error: "Bank transfer failed", details });
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
