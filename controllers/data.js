const User = require("../models/User");
const { getDataPlans } = require("../services/stroWalletService");
const asyncHandler = require("../middlewares/async");
const ErrorResponse = require("../utils/errorResponse");

exports.dataPlans = asyncHandler(async (req, res, next) => {
  try {
    const { service_name } = req.query;

    const result = await getDataPlans({ service_name });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    // Handle Strowallet error response
    if (error.response && error.response.data) {
      console.error(error.response?.data || error.message);
      return next(
        new ErrorResponse(
          error.response.data.message ||
            "Strowallet data plans retrieval failed",
          error.response.status || 500
        )
      );
    }
    return next(new ErrorResponse(error.message || "Server Error", 500));
  }
});

exports.buyData = asyncHandler(async (req, res, next) => {
  try {
    const { amount, phone, service_name, service_id, variation_code } =
      req.body;

    const user = await User.findById({ _id: req.user.id });
    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }
    if (user.accountBalance < amount) {
      return next(new ErrorResponse("Insufficient Funds", 400));
    }

    // Assuming you have a function to buy data from StroWallet
    const result = await buyData({
      amount,
      phone,
      service_name,
      service_id,
      variation_code,
    });

    if(result) {
      user.accountBalance -= amount;
      const updatedUser = await user.save();

      res.status(200).json({ success: true, data: updatedUser });
    } else {
      return next(new ErrorResponse("Data purchase failed", 500));
    }
  } catch (error) {
    if (error.response && error.response.data) {
      console.error(error.response?.data || error.message);
      return next(
        new ErrorResponse(
          error.response.data.message || "Strowallet data purchase failed",
          error.response.status || 500
        )
      );
    }
    return next(new ErrorResponse(error.message || "Server Error", 500));
  }
});
