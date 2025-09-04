// middleware/checkBlocked.js
const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse");

exports.checkBlocked = async (req, res, next) => {
  try {
    const userId = req.user.id;
    if (!userId) return next(new ErrorResponse("Unauthorized", 401));

    const user = await User.findById(userId);
    if (!user) return next(new ErrorResponse("User not found", 404));

    if (user.isBlocked) {
      return next(
        new ErrorResponse("Your account is blocked. Contact admin.", 403)
      );
    }

    next();
  } catch (err) {
    next(err);
  }
};
