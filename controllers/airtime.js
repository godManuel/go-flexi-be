const { purchaseAirtime } = require("../services/stroWalletService");
const asyncHandler = require("../middlewares/async");
const ErrorResponse = require("../utils/errorResponse");

exports.buyAirtime = asyncHandler(async (req, res, next) => {
  try {
    const { amount, phone, service_name } = req.body;

    const user = await User.findById({ _id: req.user.id });
    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }
    if (user.accountBalance < amount) {
      return next(new ErrorResponse("Insufficient Funds", 400));
    }

    const result = await purchaseAirtime({
      amount,
      phone,
      service_name,
    });

    if (result) {
      user.accountBalance -= amount;
      const updatedUser = await user.save();

      res.status(200).json({ success: true, data: updatedUser });
    } else {
      return next(new ErrorResponse("Airtime purchase failed", 500));
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
