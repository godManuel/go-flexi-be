const User = require("../models/User");
const {
  createVirtualUSDCard,
  exchangeRate,
  fundVirtualUSDCard,
} = require("../services/stroWalletService");
const asyncHandler = require("../middlewares/async");
const ErrorResponse = require("../utils/errorResponse");

// Function to create a virtual USD card
exports.createVUSDCard = asyncHandler(async (req, res, next) => {
  try {
    const exchangeResp = await exchangeRate();
    if (!exchangeResp) {
      return next(new ErrorResponse("Failed to retrieve exchange rate", 500));
    }

    let exchangeRateValue = Math.floor(exchangeResp.rate); // Convert to integer
    console.log("Exchange Rate (int):", exchangeRateValue);

    const { card_type, amount, mode } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    const amountInNaira = amount * exchangeRateValue;
    console.log("Amount in Naira:", amountInNaira);

    if (user.accountBalance < amountInNaira) {
      return next(new ErrorResponse("Insufficient funds", 400));
    }

    // Ensure minimum balance of 5000 after deduction
    if (user.accountBalance - amountInNaira < 5000) {
      return next(
        new ErrorResponse(
          "Insufficient funds: minimum balance of 5000 required after transaction",
          400
        )
      );
    }

    const result = await createVirtualUSDCard({
      name_on_card: user.fullName,
      card_type,
      amount,
      customerEmail: user.email,
      mode,
    });

    if (result) {
      user.accountBalance -= amountInNaira; // Deduct based on exchange rate
      await user.save();

      return res.status(200).json({ success: true, data: result });
    } else {
      return next(new ErrorResponse("Virtual card creation failed", 500));
    }
  } catch (error) {
    if (error.response && error.response.data) {
      console.error(error.response?.data || error.message);
      return next(
        new ErrorResponse(
          error.response.data.message ||
            "Strowallet virtual card creation failed",
          error.response.status || 500
        )
      );
    }
    return next(new ErrorResponse(error.message || "Server Error", 500));
  }
});

// Function to get the exchange rate
exports.getExchangeRate = asyncHandler(async (req, res, next) => {
  const result = await exchangeRate();
  if (result) {
    res.status(200).json({ success: true, data: result });
  } else {
    return next(new ErrorResponse("Failed to retrieve exchange rate", 500));
  }
});

// Function to fund the virtual card
exports.fundVUSDCard = asyncHandler(async (req, res, next) => {
  try {
    const exchangeResp = await exchangeRate();
    if (!exchangeResp) {
      return next(new ErrorResponse("Failed to retrieve exchange rate", 500));
    }

    let exchangeRateValue = Math.floor(exchangeResp.rate); // Convert to integer
    console.log("Exchange Rate (int):", exchangeRateValue);

    const { amount, card_id } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    const amountInNaira = amount * exchangeRateValue;
    console.log("Amount in Naira:", amountInNaira);

    if (user.accountBalance < amountInNaira) {
      return next(new ErrorResponse("Insufficient funds", 400));
    }

    // Ensure minimum balance of 5000 after deduction
    if (user.accountBalance - amountInNaira < 5000) {
      return next(
        new ErrorResponse(
          "Insufficient funds: minimum balance of 5000 required after transaction",
          400
        )
      );
    }

    // Assuming you have a service to fund the virtual card
    const result = await fundVirtualUSDCard({
      card_id,
      amount,
      customerEmail: user.email,
    });

    if (result) {
      user.accountBalance -= amount; // Deduct the amount from user's balance
      await user.save();

      return res.status(200).json({ success: true, data: result });
    } else {
      return next(new ErrorResponse("Failed to fund virtual card", 500));
    }
  } catch (error) {
    if (error.response && error.response.data) {
      console.error(error.response?.data || error.message);
      return next(
        new ErrorResponse(
          error.response.data.message || "Strowallet funding failed",
          error.response.status || 500
        )
      );
    }
    return next(new ErrorResponse(error.message || "Server Error", 500));
  }
});
