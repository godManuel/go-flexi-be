const User = require("../models/User");
const {
  createVirtualUSDCard,
  exchangeRate,
  fundVirtualUSDCard,
  withdrawFromVirtualUSDCard,
  getCardTransactions,
  getCardDetails,
} = require("../services/stroWalletService");
const asyncHandler = require("../middlewares/async");
const ErrorResponse = require("../utils/errorResponse");
const path = require("path");
const fs = require("fs");

exports.uploadCustomerImages = asyncHandler(async (req, res, next) => {
  const files = req.files;

  if (!files || (!files.image && !files.idCard)) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  const uploadDir = path.join(__dirname, "../uploads/");

  // make sure folder exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  let profileImageUrl, idCardUrl;

  // handle profile image upload
  if (files.image && files.image[0]) {
    const imageFile = files.image[0];
    const imageName = Date.now() + "-" + imageFile.originalname;
    const imagePath = path.join(uploadDir, imageName);

    fs.renameSync(imageFile.path, imagePath);

    profileImageUrl = `/uploads/${imageName}`;
  }

  // handle ID card upload
  if (files.idCard && files.idCard[0]) {
    const idFile = files.idCard[0];
    const idName = Date.now() + "-" + idFile.originalname;
    const idPath = path.join(uploadDir, idName);

    fs.renameSync(idFile.path, idPath);

    idCardUrl = `/uploads/${idName}`;
  }

  let user = await User.findById(req.user.id);
  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }

  // update servant record with fixed fields
  user = await User.findByIdAndUpdate(
    user.id,
    {
      idCardType: req.body.idCardType,
      idNumber: req.body.idNumber,
      ...(profileImageUrl && { profileImage: profileImageUrl }),
      ...(idCardUrl && { idCard: idCardUrl }),
    },
    { new: true, runValidators: true }
  ).lean();

  res.status(200).json({
    success: true,
    message: "Customer image & idCard uploaded!",
    data: user,
  });
});

// Function to create card customer
exports.createCardCustomer = asyncHandler(async (req, res, next) => {
  try {
    const user = await User.findById({ _id: req.user.id });

    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    const {
      houseNumber,
      firstName,
      lastName,
      idNumber,
      dateOfBirth,
      idImage,
      userPhoto,
      line1,
      state,
      zipcode,
      city,
      country,
      idType,
    } = req.query;

    const result = await confirmBVN({
      houseNumber,
      firstName,
      lastName,
      idNumber,
      customerEmail: user.email,
      phoneNumber: user.phoneNumber,
      dateOfBirth,
      idImage: user.idCard,
      userPhoto: user.profileImage,
      line1,
      state,
      zipcode,
      city,
      country,
      idType: user.idCardType,
    });

    res.json({ success: true, data: result });
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

// Function to create a virtual USD card
exports.createVUSDCard = asyncHandler(async (req, res, next) => {
  try {
    const exchangeResp = await exchangeRate();
    if (!exchangeResp) {
      return next(new ErrorResponse("Failed to retrieve exchange rate", 500));
    }

    let exchangeRateValue = Math.floor(exchangeResp.rate); // Convert to integer

    const serviceFeePerDollar = 2.5;
    const totalRate = exchangeRateValue + serviceFeePerDollar;
    console.log(
      "Exchange Rate (int):",
      exchangeRateValue,
      "Service Fee per $:",
      serviceFeePerDollar,
      "Total Rate:",
      totalRate
    );

    const { card_type, amount, mode } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    const amountInNaira = amount * totalRate;
    console.log("Amount in Naira (with service fee):", amountInNaira);

    if (user.isKYC !== "verified") {
      return res.status(403).json({ error: "KYC verification required" });
    }

    if (user.accountBalance < amountInNaira) {
      return next(new ErrorResponse("Insufficient funds", 400));
    }

    // Ensure minimum balance of 5000 after deduction
    if (user.accountBalance - amountInNaira < 5000) {
      return next(
        new ErrorResponse(
          "Insufficient funds: minimum balance of 5000 required after transaction",
          400
        )
      );
    }

    const result = await createVirtualUSDCard({
      name_on_card: user.fullName,
      card_type,
      amount,
      customerEmail: user.email,
      mode,
    });

    console.log(result);

    if (result) {
      user.accountBalance -= amountInNaira; // Deduct based on exchange rate
      user.vusd_card = result.response.card_id;
      const savedUser = await user.save();

      return res.status(200).json({ success: true, data: savedUser });
    } else {
      return next(new ErrorResponse("Virtual card creation failed", 500));
    }
  } catch (error) {
    if (error.response && error.response.data) {
      console.error(error.response?.data || error.message);
      return next(
        new ErrorResponse(
          error.response.data.message ||
            "Strowallet virtual card creation failed",
          error.response.status || 500
        )
      );
    }
    return next(new ErrorResponse(error.message || "Server Error", 500));
  }
});

// Function to get the exchange rate
exports.getExchangeRate = asyncHandler(async (req, res, next) => {
  const result = await exchangeRate();
  if (result) {
    res.status(200).json({ success: true, data: result });
  } else {
    return next(new ErrorResponse("Failed to retrieve exchange rate", 500));
  }
});

// Function to fund the virtual card
exports.fundVUSDCard = asyncHandler(async (req, res, next) => {
  try {
    const exchangeResp = await exchangeRate();
    if (!exchangeResp) {
      return next(new ErrorResponse("Failed to retrieve exchange rate", 500));
    }

    let exchangeRateValue = Math.floor(exchangeResp.rate); // Convert to integer
    const serviceFeePerDollar = 100;
    const totalRate = exchangeRateValue + serviceFeePerDollar;
    console.log(
      "Exchange Rate (int):",
      exchangeRateValue,
      "Service Fee per $:",
      serviceFeePerDollar,
      "Total Rate:",
      totalRate
    );

    const { card_id, amount } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    if (user.vusd_card !== card_id) {
      return next(
        new ErrorResponse("Card ID does not match user's virtual card", 400)
      );
    }

    const amountInNaira = amount * totalRate;
    console.log("Amount in Naira (with service fee):", amountInNaira);

    if (user.isKYC !== "verified") {
      return res.status(403).json({ error: "KYC verification required" });
    }

    if (user.accountBalance < amountInNaira) {
      return next(new ErrorResponse("Insufficient funds", 400));
    }

    // Ensure minimum balance of 5000 after deduction
    if (user.accountBalance - amountInNaira < 5000) {
      return next(
        new ErrorResponse(
          "Insufficient funds: minimum balance of 5000 required after transaction",
          400
        )
      );
    }

    // Assuming you have a service to fund the virtual card
    const result = await fundVirtualUSDCard({
      card_id: user.vusd_card,
      amount,
      customerEmail: user.email,
    });

    if (result) {
      user.accountBalance -= amount; // Deduct the amount from user's balance
      await user.save();

      return res.status(200).json({ success: true, data: result });
    } else {
      return next(new ErrorResponse("Failed to fund virtual card", 500));
    }
  } catch (error) {
    if (error.response && error.response.data) {
      console.error(error.response?.data || error.message);
      return next(
        new ErrorResponse(
          error.response.data.message || "Strowallet funding failed",
          error.response.status || 500
        )
      );
    }
    return next(new ErrorResponse(error.message || "Server Error", 500));
  }
});

// Function to withdraw from the virtual USD card
exports.withdrawFromVUSDCard = asyncHandler(async (req, res, next) => {
  try {
    const { card_id, amount, mode } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    if (user.vusd_card !== card_id) {
      return next(
        new ErrorResponse("Card ID does not match user's virtual card", 400)
      );
    }

    if (user.isKYC !== "verified") {
      return res.status(403).json({ error: "KYC verification required" });
    }

    // Assuming you have a service to withdraw from the virtual card
    const result = await withdrawFromVirtualUSDCard({
      card_id: user.vusd_card,
      amount,
      mode,
    });

    if (result) {
      return res.status(200).json({ success: true, data: result });
    } else {
      return next(
        new ErrorResponse("Failed to withdraw from virtual card", 500)
      );
    }
  } catch (error) {
    if (error.response && error.response.data) {
      console.error(error.response?.data || error.message);
      return next(
        new ErrorResponse(
          error.response.data.message || "Strowallet withdrawal failed",
          error.response.status || 500
        )
      );
    }
    return next(new ErrorResponse(error.message || "Server Error", 500));
  }
});

// Function to get card transactions
exports.cardTransactions = asyncHandler(async (req, res, next) => {
  try {
    const { card_id, mode } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    if (user.vusd_card !== card_id) {
      return next(
        new ErrorResponse("Card ID does not match user's virtual card", 400)
      );
    }

    if (user.isKYC !== "verified") {
      return res.status(403).json({ error: "KYC verification required" });
    }

    const result = await getCardTransactions({ card_id: user.vusd_card, mode });

    if (result) {
      return res.status(200).json({ success: true, data: result });
    } else {
      return next(
        new ErrorResponse("Failed to retrieve card transactions", 500)
      );
    }
  } catch (error) {
    if (error.response && error.response.data) {
      console.error(error.response?.data || error.message);
      return next(
        new ErrorResponse(
          error.response.data.message ||
            "Strowallet transaction retrieval failed",
          error.response.status || 500
        )
      );
    }
    return next(new ErrorResponse(error.message || "Server Error", 500));
  }
});

exports.cardDetails = asyncHandler(async (req, res, next) => {
  try {
    const { card_id, mode } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    if (user.vusd_card !== card_id) {
      return next(
        new ErrorResponse("Card ID does not match user's virtual card", 400)
      );
    }

    if (user.isKYC !== "verified") {
      return res.status(403).json({ error: "KYC verification required" });
    }

    // Assuming you have a service to get card details
    const result = await getCardDetails({ card_id: user.vusd_card, mode });

    if (result) {
      return res.status(200).json({ success: true, data: result });
    } else {
      return next(new ErrorResponse("Failed to retrieve card details", 500));
    }
  } catch (error) {
    if (error.response && error.response.data) {
      console.error(error.response?.data || error.message);
      return next(
        new ErrorResponse(
          error.response.data.message ||
            "Strowallet card details retrieval failed",
          error.response.status || 500
        )
      );
    }
    return next(new ErrorResponse(error.message || "Server Error", 500));
  }
});
