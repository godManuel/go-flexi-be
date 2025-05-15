const asyncHandler = require("../middlewares/async");
const User = require("../models/User");
const axios = require("axios");
const ErrorResponse = require("../utils/errorResponse");

exports.createUser = asyncHandler(async (req, res, next) => {
  const { fullName, email, password, phoneNumber } = req.body;

  try {
    // Check if user already exists
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ErrorResponse("User already exists", 400));
    }

    // Prepare StroWallet payload
    const payload = {
      account_name: fullName,
      email: email,
      phone: phoneNumber,
      public_key: process.env.STROWALLET_PUBLIC_KEY,
      webhook_url: `https://go-flexi-be.onrender.com/webhooks/strowallet`,
    };

    // Call StroWallet API
    const response = await axios.post(
      "https://strowallet.com/api/virtual-bank/safehaven/",
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.STROWALLET_PUBLIC_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result = response.data;

    // If StroWallet fails, stop the process
    if (!result.success) {
      return next(new ErrorResponse(result.message || "StroWallet error", 400));
    }

    // Now create the user in the database
    const user = await User.create({
      fullName,
      email,
      password,
      phoneNumber,
      accountName: req.body.fullName,
      accountNumber: result.account_number,
      bankName: result.bank_name,
    });

    const token = user.getSignedToken();

    await user.save();

    // console.log(token);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error(
      "Error sending request to StroWallet:",
      error.response?.data || error.message
    );
    return next(new ErrorResponse("Failed to create virtual account", 500));
  }
});
