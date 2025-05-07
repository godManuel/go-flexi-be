const asyncHandler = require("../middlewares/async");
const User = require("../models/User");
const axios = require("axios");
const ErrorResponse = require("../utils/errorResponse");

exports.createUser = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  let user = await User.findOne({ email });
  if (user) return next(new ErrorResponse("User already exists", 400));

  user = await User.create(req.body);
  await user.save();

  const payload = {
    account_name: user.fullName,
    email: user.email,
    phone: user.phoneNumber,
    public_key: process.env.STROWALLET_PUBLIC_KEY,
    webhook_url: `https://go-flexi-be.onrender.com/webhooks/create-account`,
  };

  try {
    const response = await axios.post(
      "https://strowallet.com/api/virtual-bank/new-customer/",
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.STROWALLET_PUBLIC_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Request sent to StroWallet:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error sending request to StroWallet:",
      error.response?.data || error.message
    );
    throw error;
  }
});
