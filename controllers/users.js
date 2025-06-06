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

// Get all users only for admin
exports.getAllUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find().select("-password");
  if (!users || users.length === 0) {
    return next(new ErrorResponse("No users found", 404));
  }

  res.status(200).json({
    success: true,
    users,
  });
});

// Update user account balance if user account number is available in database. Only admin can update user account balance
exports.updateUserBalance = asyncHandler(async (req, res, next) => {
  const { accountNumber, amount } = req.body;
  if (!accountNumber || !amount) {
    return next(
      new ErrorResponse("Account number and amount are required", 400)
    );
  }

  const user = await User.findOne({ accountNumber });
  if (!user) {
    return next(
      new ErrorResponse("User not found with this account number", 404)
    );
  }

  user.accountBalance += amount;
  await user.save();

  res.status(200).json({
    success: true,
    message: "User account balance updated successfully",
    user: {
      id: user.id,
      accountBalance: user.accountBalance,
    },
  });
});

// Create a new user for admin with just email, full name and password, with role set to admin automaticaly 
exports.createAdmin = asyncHandler(async (req, res, next) => {
  const { email, fullName, password } = req.body;
  if (!email || !fullName || !password) {
    return next(new ErrorResponse("Email, full name and password are required", 400));
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorResponse("User already exists with this email", 400));
  }

  const user = await User.create({
    email,
    fullName,
    password,
    role: "admin", // Automatically set role to admin
  });

  res.status(201).json({
    success: true,
    message: "User created successfully",
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
  });
});