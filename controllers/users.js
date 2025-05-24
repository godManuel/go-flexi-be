// Require express and the User model
const User = require("../models/User");
const asyncHandler = require("../middlewares/async");
const ErrorResponse = require("../utils/errorResponse");

exports.getUser = asyncHandler(async (req, res, next) => {
  const userId = req.params.id;
  const loggedInUserId = req.user.id; // Assuming req.user is set by authentication middleware

  if (userId !== loggedInUserId) {
    return next(new ErrorResponse("Unauthorized access", 403));
  }

  const user = await User.findById(userId).select("-password");
  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }

  res.status(200).json({
    success: true,
    user,
  });
});
