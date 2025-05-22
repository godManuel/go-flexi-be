const asyncHandler = require("../middlewares/async");
const ErrorResponse = require("../utils/errorResponse");
const axios = require("axios");
const { bankCodes } = require("../config/bankCodes.js");
const Transfer = require("../models/Transfer.js");
const User = require("../models/User.js");

exports.bankTransfer = asyncHandler(async (req, res, next) => {
  try {
    const {
      amount,
      account_number,
      narration,
      name_enquiry_reference,
      SenderName, // optional
      bank_name, // user-provided
    } = req.query;

    if (
      !amount ||
      !account_number ||
      !narration ||
      !name_enquiry_reference ||
      !bank_name
    ) {
      return next(new ErrorResponse("Missing required fields", 400));
    }

    // Match the bank_code using bank_name
    const matchedBank = bankCodes.find(
      (bank) =>
        bank.bankName.toLowerCase().trim() === bank_name.toLowerCase().trim()
    );

    if (!matchedBank) {
      return next(
        new ErrorResponse(`Unsupported bank name: ${bank_name}`, 400)
      );
    }

    const bank_code = matchedBank.bankCode;

    const payload = {
      public_key: process.env.STROWALLET_PUBLIC_KEY,
      amount,
      bank_code,
      account_number,
      narration,
      name_enquiry_reference,
    };

    if (SenderName) {
      payload.SenderName = SenderName;
    }

    const transferAmount = Number(amount);
    const transferFee = Number(process.env.TRANSFER_FEE);
    const totalRequired = transferAmount + transferFee;

    console.log(totalRequired);

    // Get user from DB
    const user = await User.findById(req.user.id);
    if (!user) return next(new ErrorResponse("User not found", 404));

    console.log(user);
    if (user.accountBalance < totalRequired)
      return next(new ErrorResponse("Insufficient funds", 400));

    // Send request to StroWallet
    const response = await axios.post(
      "https://strowallet.com/api/banks/request/",
      payload,
      {
        headers: { accept: "application/json" },
      }
    );

    // Save full request + response to DB
    await Transfer.create({
      ...payload,
      bank_name, // keep the original name user sent
      response: response.data,
    });

    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Request failed", details: error.message });
  }
});
