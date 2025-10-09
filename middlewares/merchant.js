const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse");

const enforceMerchantUsdt = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    if (user.tier === "merchant" && user.usdtBalance < 15) {
      return next(
        new ErrorResponse(
          "Merchants must maintain a minimum USDT balance of $15 to carry out transactions.",
          403
        )
      );
    }

    next();
  } catch (error) {
    return next(new ErrorResponse(error.message || "Server Error", 500));
  }
};

module.exports = enforceMerchantUsdt;
