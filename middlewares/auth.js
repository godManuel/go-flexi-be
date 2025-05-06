const jwt = require("jsonwebtoken");
const ErrorResponse = require("../utils/errorResponse.js");
const asyncHandler = require("./async.js");
const User = require("../models/User.js");

exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new ErrorResponse("No token provided", 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id);

    next();
  } catch (err) {
    console.log(err);
    return next(new ErrorResponse("Invalid token provided", 401));
  }
});

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ErrorResponse("Not allowed to perform this action", 403));
    }
    next();
  };
};
