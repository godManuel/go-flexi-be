const {
  verifyBVN,
  confirmBVN,
  verifyNIN,
  verifyCAC,
} = require("../services/stroWalletService");
const asyncHandler = require("../middlewares/async");
const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse");
const path = require("path");
// const axios = require("axios");
const { bankCodes } = require("../config/bankCodes.js");
const { getReceiverAcctName } = require("../services/stroWalletService.js");
const CorporateBiz = require("../models/CorporateBiz.js");

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
          error.response.status || 500,
        ),
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

    if (user.accountBalance - 1000 < 5000) {
      return next(new ErrorResponse("Insufficient Funds after deduction", 400));
    }

    if (result) {
      const savedUser = await User.findByIdAndUpdate(
        req.user.id,
        {
          tier: "merchant",
          bvnVerified: true,
          $inc: { accountBalance: -1000 },
        },
        { new: true },
      );

      res.status(200).json({ success: true, data: savedUser });
    }
  } catch (error) {
    if (error.response && error.response.data) {
      console.error(error.response?.data || error.message);
      return next(
        new ErrorResponse(
          error.response.data.message || "Strowallet BVN confirmation failed",
          error.response.status || 500,
        ),
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

    if (user.accountBalance - 1000 < 5000) {
      return next(new ErrorResponse("Insufficient Funds after deduction", 400));
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
          isKYC: "verified",
          tier: "business",
          ninNumber: number_nin,
          ninProvided: true,
          $inc: { accountBalance: -1000 },
        },
        { new: true },
      );

      res.status(200).json({ success: true, data: savedUser });
    }
  } catch (error) {
    if (error.response && error.response.data) {
      console.error(error.response?.data || error.message);
      return next(
        new ErrorResponse(
          error.response.data.message || "Strowallet NIN verification failed",
          error.response.status || 500,
        ),
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

    if (!user.usdtBalance || user.usdtBalance < 15) {
      return next(
        new ErrorResponse(
          "Insufficient USDT balance (minimum $15 required)",
          400,
        ),
      );
    }

    if (user.accountBalance < 5000) {
      return next(new ErrorResponse("Insufficient Funds", 400));
    }

    if (user.accountBalance - 5500 < 5000) {
      return next(new ErrorResponse("Insufficient Funds after deduction", 400));
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
      let uniqueCode;
      let codeExists = true;

      do {
        uniqueCode = Math.floor(1000000 + Math.random() * 9000000);
        codeExists = await User.exists({
          merchantVerificationCode: uniqueCode,
        });
      } while (codeExists);

      const savedUser = await User.findByIdAndUpdate(
        req.user.id,
        {
          cacVerified: true,
          tier: "merchant",
          merchantVerificationCode: uniqueCode,
          cacNumber: rc_number,
          cacProvided: true,
          $inc: { accountBalance: -5500 },
        },
        { new: true },
      );

      res.status(200).json({ success: true, data: savedUser });
    }
  } catch (error) {
    if (error.response && error.response.data) {
      console.error(error.response?.data || error.message);
      return next(
        new ErrorResponse(
          error.response.data.message || "Strowallet NIN verification failed",
          error.response.status || 500,
        ),
      );
    }
    return next(new ErrorResponse(error.message || "Server Error", 500));
  }
});

exports.verifyCorporateBusiness = asyncHandler(async (req, res, next) => {
  const UPGRADE_FEE = 5500;
  const MIN_ACCOUNT_BALANCE = 5000;
  const MIN_USDT_BALANCE = 15;

  const user = await User.findById(req.user.id).populate("corporateBiz");
  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }

  if (!user.usdtBalance || user.usdtBalance < MIN_USDT_BALANCE) {
    return next(
      new ErrorResponse(
        `Insufficient USDT balance (minimum $${MIN_USDT_BALANCE} required)`,
        400,
      ),
    );
  }

  // Guard against re-upgrading or duplicate pending requests
  if (user.corporateBiz) {
    if (user.corporateBiz.status === "verified") {
      return next(
        new ErrorResponse("This account has already been upgraded", 400),
      );
    }
    if (["unverified", "pending"].includes(user.corporateBiz.status)) {
      return next(
        new ErrorResponse(
          "A cooperative verification request is already awaiting review",
          400,
        ),
      );
    }
    // status === "declined" -> falls through, allowed to resubmit
  }

  // Only charge the upgrade fee the first time. A resubmission after a
  // decline does not get re-charged.
  const requiresDeduction = !user.corporateBiz;

  if (
    requiresDeduction &&
    user.accountBalance - UPGRADE_FEE < MIN_ACCOUNT_BALANCE
  ) {
    return next(
      new ErrorResponse(
        `Insufficient funds. A minimum balance of ${MIN_ACCOUNT_BALANCE} must remain after the ${UPGRADE_FEE} upgrade fee`,
        400,
      ),
    );
  }

  // Whitelist only the fields CorporateBiz actually expects, rather than
  // spreading req.body directly.
  const {
    businessName,
    accountNumber,
    accountName,
    bankName,
    cooperativeType,
    corporativeName,
    certificateNumber,
    profileNumber,
    verificationCode,
    memberNumber,
    chairmanDetails,
    secretaryDetails,
  } = req.body;

  // If resubmitting after a decline, keep the old record for history
  // instead of letting it become orphaned.
  if (user.corporateBiz && user.corporateBiz.status === "declined") {
    user.cooperatives.push(user.corporateBiz._id);
  }

  const corporateBiz = await CorporateBiz.create({
    businessName,
    accountNumber,
    accountName,
    bankName,
    cooperativeType,
    corporativeName,
    certificateNumber,
    profileNumber,
    verificationCode,
    memberNumber,
    chairmanDetails,
    secretaryDetails,
    user: user._id,
    purpose: "upgrade",
    status: "unverified",
  });

  const updatePayload = {
    corporateBiz: corporateBiz._id,
    isKYC: "pending",
    cooperatives: user.cooperatives, // carries forward the pushed history, if any
  };

  if (requiresDeduction) {
    updatePayload.$inc = { accountBalance: -UPGRADE_FEE };
  }

  const updatedUser = await User.findByIdAndUpdate(req.user.id, updatePayload, {
    new: true,
  }).populate("corporateBiz");

  res.status(200).json({ success: true, data: updatedUser });
});
