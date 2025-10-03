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
          $inc: { accountBalance: -5500 },
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

exports.verifyCorporateBusiness = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorResponse("No file uploaded", 400));
  }

  const filePath = `/uploads/${req.file.filename}`; // stored path for DB
  const absolutePath = path.join(__dirname, "..", "uploads", req.file.filename);

  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }

  if (user.accountBalance < 5000) {
    return next(new ErrorResponse("Insufficient Funds", 400));
  }

  if (user.accountBalance - 5500 < 5000) {
    return next(new ErrorResponse("Insufficient Funds after deduction", 400));
  }

  const { business_name, account_number, bank_name } = req.body;

  const matchedBank = bankCodes.find(
    (bank) =>
      bank.bankName.toLowerCase().trim() === bank_name.toLowerCase().trim()
  );

  if (!matchedBank) {
    return res
      .status(400)
      .json({ error: `Unsupported bank name: ${bank_name}` });
  }

  const bank_code = matchedBank.bankCode;

  try {
    const result = await getReceiverAcctName({
      account_number,
      bank_code,
    });

    if (result) {
      if (result.data.account_name !== business_name) {
        return next(
          new ErrorResponse(
            "Not business account! Provide the account for your business",
            400
          )
        );
      }

      const corporateBiz = await CorporateBiz.create({
        businessName: business_name,
        accountNumber: account_number,
        bankName: bank_name,
        accountName: result.data.account_name,
        image: filePath, // Save relative file path instead of Cloudinary URL
        user: req.user.id,
        status: "pending",
      });

      await corporateBiz.save();

      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        {
          corporateBiz: corporateBiz._id,
          isKYC: "pending",
          $inc: { accountBalance: -5500 },
        },
        { new: true } // returns the updated user
      ).populate("corporateBiz");

      res.status(200).json({ success: true, data: updatedUser });
    }
  } catch (error) {
    console.error("Error checking account name:", error);
    return next(new ErrorResponse("Failed to check account name", 500));
  }
});
