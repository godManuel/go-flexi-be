const asyncHandler = require("../middlewares/async");
const ErrorResponse = require("../utils/errorResponse");
const User = require("../models/User");
const { verifyMeterNo, subscribeElectricity } = require("../services/stroWalletService");

exports.verifyMeter = asyncHandler(async (req, res, next) => {
  try {
    const { service_name, meter_type, meter_number } = req.query;

    const result = await verifyMeterNo({
      service_name,
      meter_type,
      meter_number,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    if (error.response && error.response.data) {
      console.error(error.response?.data || error.message);
      return next(
        new ErrorResponse(
          error.response.data.message || "Strowallet meter verification failed",
          error.response.status || 500
        )
      );
    }
    return next(new ErrorResponse(error.message || "Server Error", 500));
  }
});

exports.purchaseElectricity = asyncHandler(async (req, res, next) => {
  try {
    const { amount, phone, service_name, meter_type, meter_number } = req.body;

    const user = await User.findById({ _id: req.user.id });
    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }
    if (user.accountBalance < amount) {
      return next(new ErrorResponse("Insufficient Funds", 400));
    }

    const result = await subscribeElectricity({
      amount,
      phone,
      service_name,
      meter_type,
      meter_number,
    });

    if (result) {
      user.accountBalance -= amount;
      const updatedUser = await user.save();

      res.status(200).json({ success: true, data: updatedUser });
    } else {
      return next(new ErrorResponse("Electricity purchase failed", 500));
    }
  } catch (error) {
    if (error.response && error.response.data) {
      console.error(error.response?.data || error.message);
      return next(
        new ErrorResponse(
          error.response.data.message || "Strowallet electricity purchase failed",
          error.response.status || 500
        )
      );
    }
    return next(new ErrorResponse(error.message || "Server Error", 500));
  }
})
