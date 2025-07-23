const {
  getCableTVPlans,
  verifySmartCardNo,
  subscribeCableTv,
} = require("../services/stroWalletService");
const asyncHandler = require("../middlewares/async");
const ErrorResponse = require("../utils/errorResponse");
const User = require("../models/User");

exports.cableTvPlans = asyncHandler(async (req, res, next) => {
  try {
    const { service_id } = req.query;

    const result = await getCableTVPlans({ service_id });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
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

exports.verifySmartCard = asyncHandler(async (req, res, next) => {
  try {
    const { service_id, customer_id } = req.query;

    const result = await verifySmartCardNo({ service_id, customer_id });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
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

// Add more cable TV related functions as needed

// Example function to handle cable TV subscription
exports.requestCableTvSubscription = asyncHandler(async (req, res, next) => {
  try {
    const {
      amount,
      phone,
      service_name,
      service_id,
      variation_code,
      customer_id,
    } = req.body;

    const user = await User.findById({ _id: req.user.id });
    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }
    if (user.accountBalance < amount) {
      return next(new ErrorResponse("Insufficient Funds", 400));
    }

    const response = await subscribeCableTv({
      amount,
      phone,
      service_name,
      service_id,
      variation_code,
      customer_id,
    });

    if (response) {
      user.accountBalance -= amount;
      await user.save();
    }

    res.status(200).json({ success: true, data: response });
  } catch (error) {
    console.error(error);
    return next(new ErrorResponse("Cable TV subscription failed", 500));
  }
});
