const { sendEmail } = require("../utils/sendEmail");
const asyncHandler = require("../middlewares/async");
const User = require("../models/User");
const axios = require("axios");
const ErrorResponse = require("../utils/errorResponse");

exports.createUser = asyncHandler(async (req, res, next) => {
  const { fullName, email, password, phoneNumber } = req.body;

  try {
    // Check if user already exists
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ErrorResponse("User already exists", 400));
    }

    // Prepare StroWallet payload
    const payload = {
      account_name: fullName,
      email: email,
      phone: phoneNumber,
      public_key: process.env.STROWALLET_PUBLIC_KEY,
      webhook_url: `https://go-flexi-be.onrender.com/webhooks/strowallet`,
    };

    // Call StroWallet API
    const response = await axios.post(
      "https://strowallet.com/api/virtual-bank/paga/",
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.STROWALLET_PUBLIC_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result = response.data;

    // If StroWallet fails, stop the process
    if (!result.success) {
      return next(new ErrorResponse(result.message || "StroWallet error", 400));
    }

    // Now create the user in the database
    const user = await User.create({
      fullName,
      email,
      password,
      phoneNumber,
      // accountName: req.body.fullName,
      accountName: req.body.fullName,
      accountNumber: result.account_number,
      bankName: result.bank_name,
    });

    await user.save();

    // console.log(token);
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(
      "Error sending request to StroWallet:",
      error.response?.data || error.message
    );
    return next(new ErrorResponse("Failed to create virtual account", 500));
  }
});

exports.loginUser = asyncHandler(async (req, res, next) => {
  if (!req.body.email || !req.body.password) {
    return next(new ErrorResponse("Please enter an email and password", 400));
  }

  const user = await User.findOne({ email: req.body.email }).select(
    "+password"
  );
  if (!user) return next(new ErrorResponse("Email or password incorrect", 401));

  const isMatch = await user.matchPassword(req.body.password);

  if (!isMatch)
    return next(new ErrorResponse("Email or password incorrect", 401));

  const emailOTP = await user.getEmailOTP();
  await user.save();

  try {
    await sendEmail(
      user.email,
      `Your Verification Code is ${emailOTP}`,
      "otp-verification",
      {
        name: user.fullName,
        expiryTime: user.emailOTPExpire,
        otp: emailOTP,
      }
    );

    res.status(200).json({
      success: true,
      data: {
        email: user.email,
        role: user.role,
        message: "A confirmation code has been sent to your email",
      },
    });
  } catch (error) {
    console.log(error);
    return next(new ErrorResponse("Email could not be sent", 500));
  }
});


// @DESC        Verify User Login via Email OTP
// @ROUTE       POST  /api/v1/auth/verify-login
// @ACCESS      Private
exports.verifyLoginOTP = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new ErrorResponse("User not found", 404));

  const verifiedOTP = await user.verifyEmailOTP(req.body.emailOTP);
  if (!verifiedOTP) return next(new ErrorResponse("Invalid OTP"));

  if (user.emailOTPExpire < Date.now()) {
    await user.delete();
    next(new ErrorResponse("OTP Expired! Request a new one", 400));
  }

  user.emailOTP = undefined;
  user.emailOTPExpire = undefined;

  const token = user.getSignedToken();

  await user.save();

  res.status(200).json({
    success: true,
    data: {
      email: user.email,
      role: user.role,
      token,
    },
  });
});


// @DESC        Request Password Reset
// @ROUTE       POST  /api/v1/auth/request-password-reset
// @ACCESS      Public
exports.requestPasswordReset = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return next(new ErrorResponse("Please provide an email", 400));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }

  const emailOTP = await user.getResetPasswordToken();
  await user.save();

  try {
    await sendEmail(user.email, `Your OTP is ${emailOTP}`, "password-reset", {
      name: user.fullName,
      otp: emailOTP,
    });

    res.status(200).json({
      success: true,
      data: "An OTP has been sent to your email",
    });
  } catch (error) {
    console.log(error);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    return next(new ErrorResponse("Email could not be sent", 500));
  }
});

// @DESC        Reset Password
// @ROUTE       POST  /api/v1/auth/reset-password
// @ACCESS      Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return next(
      new ErrorResponse("Please provide email and new password", 400)
    );
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(new ErrorResponse("User not found", 400));
  }

  user.password = newPassword;

  await user.save();

  res.status(200).json({
    success: true,
    data: "Password has been reset successfully",
  });
});

exports.verifyPasswordOTP = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new ErrorResponse("User not found", 404));

  const verifiedOTP = await user.verifyResetPasswordToken(req.body.emailOTP);
  if (!verifiedOTP) return next(new ErrorResponse("Invalid OTP"));

  if (user.resetPasswordExpire < Date.now()) {
    // await user.delete();
    return next(new ErrorResponse("OTP Expired! Request a new one", 400));
  }

  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  res.status(200).json({
    success: true,
    data: {
      message: "OTP verified successfully",
      email: user.email,
    },
  });
});

// exports.verifyLoginOTP = asyncHandler(async (req, res, next) => {
//   const user = await User.findOne({ email: req.body.email });
//   if (!user) return next(new ErrorResponse("User not found", 404));

//   const verifiedOTP = await user.verifyEmailOTP(req.body.emailOTP);
//   if (!verifiedOTP) return next(new ErrorResponse("Invalid OTP"));

//   if (user.emailOTPExpire < Date.now()) {
//     await user.delete();
//     next(new ErrorResponse("OTP Expired! Request a new one", 400));
//   }

//   user.emailOTP = undefined;
//   user.emailOTPExpire = undefined;

//   const token = user.getSignedToken();

//   await user.save();

//   res.status(200).json({
//     success: true,
//     data: {
//       email: user.email,
//       role: user.role,
//       message,
//       token,
//     },
//   });
// });
