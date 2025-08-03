const User = require("../models/User");
const {
  createVirtualUSDCard,
  exchangeRate,
  fundVirtualUSDCard,
  withdrawFromVirtualUSDCard,
  getCardTransactions,
  getCardDetails 
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
    const serviceFeePerDollar = 100;
    const totalRate = exchangeRateValue + serviceFeePerDollar;
    console.log(
      "Exchange Rate (int):",
      exchangeRateValue,
      "Service Fee per $:",
      serviceFeePerDollar,
      "Total Rate:",
      totalRate
    );

    const { card_type, amount, mode } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    const amountInNaira = amount * totalRate;
    console.log("Amount in Naira (with service fee):", amountInNaira);

    if (user.isKYC !== "verified") {
      return res.status(403).json({ error: "KYC verification required" });
    }

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

    console.log(result);

    if (result) {
      user.accountBalance -= amountInNaira; // Deduct based on exchange rate
      user.vusd_card = result.response.card_id;
      const savedUser = await user.save();

      return res.status(200).json({ success: true, data: savedUser });
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
    const serviceFeePerDollar = 100;
    const totalRate = exchangeRateValue + serviceFeePerDollar;
    console.log(
      "Exchange Rate (int):",
      exchangeRateValue,
      "Service Fee per $:",
      serviceFeePerDollar,
      "Total Rate:",
      totalRate
    );

    const { amount } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    if (user.vusd_card !== card_id) {
      return next(
        new ErrorResponse("Card ID does not match user's virtual card", 400)
      );
    }

    const amountInNaira = amount * totalRate;
    console.log("Amount in Naira (with service fee):", amountInNaira);

    if (user.isKYC !== "verified") {
      return res.status(403).json({ error: "KYC verification required" });
    }

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
      card_id: user.vusd_card,
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

// Function to withdraw from the virtual USD card
exports.withdrawFromVUSDCard = asyncHandler(async (req, res, next) => {
  try {
    const { amount, mode } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    if (user.vusd_card !== card_id) {
      return next(
        new ErrorResponse("Card ID does not match user's virtual card", 400)
      );
    }

    if (user.isKYC !== "verified") {
      return res.status(403).json({ error: "KYC verification required" });
    }

    // Assuming you have a service to withdraw from the virtual card
    const result = await withdrawFromVirtualUSDCard({
      card_id: user.vusd_card,
      amount,
      mode,
    });

    if (result) {
      return res.status(200).json({ success: true, data: result });
    } else {
      return next(
        new ErrorResponse("Failed to withdraw from virtual card", 500)
      );
    }
  } catch (error) {
    if (error.response && error.response.data) {
      console.error(error.response?.data || error.message);
      return next(
        new ErrorResponse(
          error.response.data.message || "Strowallet withdrawal failed",
          error.response.status || 500
        )
      );
    }
    return next(new ErrorResponse(error.message || "Server Error", 500));
  }
});

// Function to get card transactions
exports.cardTransactions = asyncHandler(async (req, res, next) => {
  try {
    const { mode } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    if (user.vusd_card !== card_id) {
      return next(
        new ErrorResponse("Card ID does not match user's virtual card", 400)
      );
    }

    if (user.isKYC !== "verified") {
      return res.status(403).json({ error: "KYC verification required" });
    }

    const result = await getCardTransactions({ card_id: user.vusd_card, mode });

    if (result) {
      return res.status(200).json({ success: true, data: result });
    } else {
      return next(
        new ErrorResponse("Failed to retrieve card transactions", 500)
      );
    }
  } catch (error) {
    if (error.response && error.response.data) {
      console.error(error.response?.data || error.message);
      return next(
        new ErrorResponse(
          error.response.data.message ||
            "Strowallet transaction retrieval failed",
          error.response.status || 500
        )
      );
    }
    return next(new ErrorResponse(error.message || "Server Error", 500));
  }
});

exports.cardDetails = asyncHandler(async (req, res, next) => {
  try {
    const { mode } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    if (user.vusd_card !== card_id) {
      return next(
        new ErrorResponse("Card ID does not match user's virtual card", 400)
      );
    }

    if (user.isKYC !== "verified") {
      return res.status(403).json({ error: "KYC verification required" });
    }

    // Assuming you have a service to get card details
    const result = await getCardDetails({ card_id: user.vusd_card, mode });

    if (result) {
      return res.status(200).json({ success: true, data: result });
    } else {
      return next(new ErrorResponse("Failed to retrieve card details", 500));
    }
  } catch (error) {
    if (error.response && error.response.data) {
      console.error(error.response?.data || error.message);
      return next(
        new ErrorResponse(
          error.response.data.message ||
            "Strowallet card details retrieval failed",
          error.response.status || 500
        )
      );
    }
    return next(new ErrorResponse(error.message || "Server Error", 500));
  }
});
