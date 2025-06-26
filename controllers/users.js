// Require express and the User model
const User = require("../models/User");
const asyncHandler = require("../middlewares/async");
const ErrorResponse = require("../utils/errorResponse");
const { sendEmail } = require("../utils/sendEmail");

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
  const { email, amount } = req.body;
  if (!email || !amount) {
    return next(new ErrorResponse("Email and amount are required", 400));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }

  user.accountBalance += +amount;
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
    return next(
      new ErrorResponse("Email, full name and password are required", 400)
    );
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

// Get transactions for a user
exports.getUserTransactions = asyncHandler(async (req, res, next) => {
  const userId = req.params.id;
  const loggedInUserId = req.user.id; // Assuming req.user is set by authentication middleware

  if (userId !== loggedInUserId) {
    return next(new ErrorResponse("Unauthorized access", 403));
  }

  const user = await User.findById(userId).populate("transactions");
  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }

  res.status(200).json({
    success: true,
    transactions: user.transactions,
  });
});

// Get all users transactions for admin
exports.getAllUserTransactions = asyncHandler(async (req, res, next) => {
  const users = await User.find().populate("transactions");
  if (!users || users.length === 0) {
    return next(new ErrorResponse("No users found", 404));
  }

  const allTransactions = users.flatMap((user) => ({
    userId: user.id,
    transactions: user.transactions,
  }));

  res.status(200).json({
    success: true,
    transactions: allTransactions,
  });
});

exports.sendNotificationToUser = asyncHandler(async (req, res, next) => {
  const { email, subject, message } = req.body;

  if (!email || !subject || !message) {
    return next(
      new ErrorResponse("Email, subject, and message are required", 400)
    );
  }

  const user = await User.findOne({ email, role: 'user' });
  if (!user) return next(new ErrorResponse("User not found", 404));

  try {
    await sendEmail(
      email,
      subject,
      "notification", // View name
      {
        name: user.fullName,
        message,
      }
    );

    res.status(200).json({
      success: true,
      message: `Notification sent to ${email}`,
    });
  } catch (error) {
    console.error(error);
    return next(new ErrorResponse("Failed to send email", 500));
  }
});

exports.sendNotificationToUsers = asyncHandler(async (req, res, next) => {
  const { subject, message } = req.body;

  if (!subject || !message) {
    return next(new ErrorResponse("Subject and message are required", 400));
  }

  const users = await User.find({ role: 'user' });

  const promises = users.map((user) =>
    sendEmail(user.email, subject, "notification", {
      name: user.fullName,
      message,
    })
  );

  try {
    await Promise.all(promises);
    res.status(200).json({
      success: true,
      message: "Notifications sent to all users",
    });
  } catch (error) {
    console.error(error);
    return next(new ErrorResponse("Failed to send emails", 500));
  }
});
