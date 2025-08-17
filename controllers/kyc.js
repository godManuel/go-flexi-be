const {
  verifyBVN,
  confirmBVN,
  verifyNIN,
  verifyCAC
} = require("../services/stroWalletService");
const asyncHandler = require("../middlewares/async");
const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse");

exports.verifyBvn = asyncHandler(async (req, res, next) => {
  try {
    const { number, firstName, lastName, dateOfBirth, phoneNumber, mode } =
      req.query;

    const result = await verifyBVN({
      number,
      firstName,
      lastName,
      dateOfBirth,
      phoneNumber,
      mode,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    // Handle Strowallet error response
    if (error.response && error.response.data) {
      console.error(error.response?.data || error.message);
      return next(
        new ErrorResponse(
          error.response.data.message || "Strowallet verification failed",
          error.response.status || 500
        )
      );
    }
    return next(new ErrorResponse(error.message || "Server Error", 500));
  }
});

exports.confirmBvn = asyncHandler(async (req, res, next) => {
  try {
    const { trx, otp, mode } = req.query;

    const result = await confirmBVN({ trx, otp, mode });

    const user = await User.findById({ _id: req.user.id });
    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    if (user.accountBalance < 5000) {
      return next(new ErrorResponse("Insufficient Funds", 400));
    }

    if (result) {
      const savedUser = await User.findByIdAndUpdate(
        req.user.id,
        {
          tier: "merchant",
          bvnVerified: true,
          $inc: { accountBalance: -1000 },
        },
        { new: true }
      );

      res.status(200).json({ success: true, data: savedUser });
    }
  } catch (error) {
    if (error.response && error.response.data) {
      console.error(error.response?.data || error.message);
      return next(
        new ErrorResponse(
          error.response.data.message || "Strowallet BVN confirmation failed",
          error.response.status || 500
        )
      );
    }
    return next(new ErrorResponse(error.message || "Server Error", 500));
  }
});

exports.verifyNin = asyncHandler(async (req, res, next) => {
  try {
    const { number_nin, surname, firstname, birthdate, telephoneno } =
      req.query;

    const user = await User.findById({ _id: req.user.id });
    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    if (user.accountBalance < 5000) {
      return next(new ErrorResponse("Insufficient Funds", 400));
    }

    const result = await verifyNIN({
      number_nin,
      surname,
      firstname,
      birthdate,
      telephoneno,
    });

    // Optionally update user NIN status here
    if (result) {
      const savedUser = await User.findByIdAndUpdate(
        req.user.id,
        {
          ninVerified: true,
          $inc: { accountBalance: -1000 },
        },
        { new: true }
      );

      res.status(200).json({ success: true, data: savedUser });
    }
  } catch (error) {
    if (error.response && error.response.data) {
      console.error(error.response?.data || error.message);
      return next(
        new ErrorResponse(
          error.response.data.message || "Strowallet NIN verification failed",
          error.response.status || 500
        )
      );
    }
    return next(new ErrorResponse(error.message || "Server Error", 500));
  }
});

exports.verifyCac = asyncHandler(async (req, res, next) => {
  try {
    const {
      rc_number,
      company_type,
      entity_type,
      company_name,
      surname,
      firstname,
      email,
      phoneNumber,
      gender,
      city,
      occupation,
    } = req.query;

    const user = await User.findById({ _id: req.user.id });
    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    if (user.accountBalance < 5000) {
      return next(new ErrorResponse("Insufficient Funds", 400));
    }

    const result = await verifyCAC({
      rc_number,
      company_type,
      entity_type,
      company_name,
      surname,
      firstname,
      email,
      phoneNumber,
      gender,
      city,
      occupation,
    });

    // Optionally update user NIN status here
    if (result) {
      const savedUser = await User.findByIdAndUpdate(
        req.user.id,
        {
          cacVerified: true,
          isKYC: "verified",
          tier: "business",
        },
        { new: true }
      );

      res.status(200).json({ success: true, data: savedUser });
    }
  } catch (error) {
    if (error.response && error.response.data) {
      console.error(error.response?.data || error.message);
      return next(
        new ErrorResponse(
          error.response.data.message || "Strowallet NIN verification failed",
          error.response.status || 500
        )
      );
    }
    return next(new ErrorResponse(error.message || "Server Error", 500));
  }
});
