// Require express and the User model
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const axios = require("axios");
const UsdTrx = require("../models/USDTrx");
const Deposit = require("../models/Deposit");
const Transfer = require("../models/Transfer");
const asyncHandler = require("../middlewares/async");
const ErrorResponse = require("../utils/errorResponse");
const { sendEmail } = require("../utils/sendEmail");
const { calcNetAmount } = require("../utils/calcNetAmount");
const {
  getReceiverAcctName,
  createUSDTAddress,
  sendUSDT,
  exchangeRate,
  checkUSDTTransactionStatus,
} = require("../services/stroWalletService.js");
const { bankCodes } = require("../config/bankCodes.js");

exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("-password");
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
  res.status(200).json(res.advancedResults);
});

exports.getUserByEmail = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email }).select(
    "-password",
  );
  if (!user) return next(new ErrorResponse("User does not exist", 404));

  res.status(200).json({
    success: true,
    user,
  });
});

// Update user account balance if user account number is available in database. Only admin can update user account balance
exports.creditUserBalance = asyncHandler(async (req, res, next) => {
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

  await Transaction.create({
    user: user._id,
    amount: +amount,
    type: "credit",
    description: `Account credited by admin`,
    balanceAfter: user.accountBalance,
  });

  // Send credit alert email
  try {
    await sendEmail(
      user.email,
      "Naira Credit Alert",
      "credit-alert", // View name
      {
        name: user.fullName,
        amount: amount,
        date: new Date().toLocaleDateString(),
        balance: user.accountBalance,
      },
    );
  } catch (error) {
    console.error("Failed to send credit alert email:", error);
    // Optionally, you can continue without failing the request
  }

  res.status(200).json({
    success: true,
    message: "User account balance updated successfully",
    user: {
      id: user.id,
      accountBalance: user.accountBalance,
    },
  });
});

exports.debitUserBalance = asyncHandler(async (req, res, next) => {
  const { email, amount } = req.body;
  if (!email || !amount) {
    return next(new ErrorResponse("Email and amount are required", 400));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }

  if (user.accountBalance < +amount) {
    return next(new ErrorResponse("Insufficient balance", 400));
  }

  user.accountBalance -= +amount;
  await user.save();

  await Transaction.create({
    user: user._id,
    amount: +amount,
    type: "debit",
    description: `Account debited by admin`,
    balanceAfter: user.accountBalance,
  });

  // Send debit alert email
  try {
    await sendEmail(
      user.email,
      "Debit Alert",
      "debit-alert", // View name
      {
        name: user.fullName,
        amount: amount,
        date: new Date().toLocaleDateString(),
        balance: user.accountBalance,
      },
    );
  } catch (error) {
    console.error("Failed to send debit alert email:", error);
    // Optionally, you can continue without failing the request
  }

  res.status(200).json({
    success: true,
    message: "User account debited successfully",
    user: {
      id: user.id,
      accountBalance: user.accountBalance,
    },
  });
});

exports.creditUSDBalance = asyncHandler(async (req, res, next) => {
  const { email, amount } = req.body;
  if (!email || !amount) {
    return next(new ErrorResponse("Email and amount are required", 400));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }

  user.usdtBalance += +amount;
  await user.save();

  await Transaction.create({
    user: user._id,
    amount: +amount,
    type: "credit",
    description: `Account credited by admin`,
    balanceAfter: user.usdtBalance,
  });

  // Send credit alert email
  try {
    await sendEmail(
      user.email,
      "Dollar Credit Alert",
      "credit-alert-usd", // View name
      {
        name: user.fullName,
        amount: amount,
        date: new Date().toLocaleDateString(),
        balance: user.usdtBalance,
      },
    );
  } catch (error) {
    console.error("Failed to send credit alert email:", error);
    // Optionally, you can continue without failing the request
  }

  res.status(200).json({
    success: true,
    message: "User USD account balance updated successfully",
    user: {
      id: user.id,
      accountBalance: user.usdtBalance,
    },
  });
});

exports.debitUSDBalance = asyncHandler(async (req, res, next) => {
  const { email, amount } = req.body;
  if (!email || !amount) {
    return next(new ErrorResponse("Email and amount are required", 400));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }

  if (user.usdtBalance < +amount) {
    return next(new ErrorResponse("Insufficient balance", 400));
  }

  user.usdtBalance -= +amount;
  await user.save();

  await Transaction.create({
    user: user._id,
    amount: +amount,
    type: "debit",
    description: `Account debited by admin`,
    balanceAfter: user.usdtBalance,
  });

  // Send debit alert email
  try {
    await sendEmail(
      user.email,
      "Debit Alert",
      "debit-alert", // View name
      {
        name: user.fullName,
        amount: amount,
        date: new Date().toLocaleDateString(),
        balance: user.usdtBalance,
      },
    );
  } catch (error) {
    console.error("Failed to send debit alert email:", error);
    // Optionally, you can continue without failing the request
  }

  res.status(200).json({
    success: true,
    message: "User USD account debited successfully",
    user: {
      id: user.id,
      accountBalance: user.usdtBalance,
    },
  });
});

// Create a new user for admin with just email, full name and password, with role set to admin automaticaly
exports.createAdmin = asyncHandler(async (req, res, next) => {
  const { email, fullName, password } = req.body;
  if (!email || !fullName || !password) {
    return next(
      new ErrorResponse("Email, full name and password are required", 400),
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

exports.sendNotificationToUser = asyncHandler(async (req, res, next) => {
  const { email, subject, message } = req.body;

  if (!email || !subject || !message) {
    return next(
      new ErrorResponse("Email, subject, and message are required", 400),
    );
  }

  const user = await User.findOne({ email, role: "user" });
  if (!user) return next(new ErrorResponse("User not found", 404));

  try {
    await sendEmail(
      email,
      subject,
      "notification", // View name
      {
        name: user.fullName,
        message,
      },
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

  const users = await User.find({ role: "user" });

  const promises = users.map((user) =>
    sendEmail(user.email, subject, "notification", {
      name: user.fullName,
      message,
    }),
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

exports.addBeneficiary = asyncHandler(async (req, res, next) => {
  const { beneficiary_type, bank_name, account_number } = req.body;

  // Validate input
  if (!beneficiary_type || !bank_name || !account_number) {
    return res.status(400).json({
      success: false,
      error: "Beneficiary type, bank name and account number are required",
    });
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: "User not found",
    });
  }

  // Check for duplicate beneficiary
  if (
    user.beneficiaries.some(
      (b) =>
        b.accountNumber === account_number &&
        b.bankName.toLowerCase().trim() === bank_name.toLowerCase().trim(),
    )
  ) {
    return res.status(400).json({
      success: false,
      error:
        "Beneficiary with this account number and bank name already exists",
    });
  }

  // Find bank code
  const matchedBank = bankCodes.find(
    (bank) =>
      bank.bankName.toLowerCase().trim() === bank_name.toLowerCase().trim(),
  );
  if (!matchedBank) {
    return res.status(400).json({
      success: false,
      error: `Unsupported bank name: ${bank_name}`,
    });
  }
  const bank_code = matchedBank.bankCode;

  // Validate account number and get account name
  let accountName;
  try {
    const result = await getReceiverAcctName({ account_number, bank_code });
    if (!result || !result.data || !result.data.account_name) {
      return res.status(400).json({
        success: false,
        error: "Invalid account number or unable to fetch account name",
      });
    }
    accountName = result.data.account_name;
  } catch (error) {
    console.error("Error checking account name:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to check account name",
    });
  }

  // Add beneficiary
  user.beneficiaries.push({
    beneficiaryType: beneficiary_type,
    bankName: bank_name,
    accountNumber: account_number,
    accountName,
  });

  await user.save();

  return res.status(201).json({
    success: true,
    message: "Beneficiary added successfully",
    beneficiaries: user.beneficiaries,
  });
});

exports.blockUser = asyncHandler(async (req, res, next) => {
  const userId = req.params.id;

  let user = await User.findById(userId);
  if (!user) return next(new ErrorResponse("User not found", 404));

  user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        isBlocked: true,
      },
    },
    { new: true },
  );

  res.json({ success: true, message: "User blocked successfully", user });
});

exports.unblockUser = asyncHandler(async (req, res, next) => {
  const userId = req.params.id;

  let user = await User.findById(userId);
  if (!user) return next(new ErrorResponse("User not found", 404));

  user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        isBlocked: false,
      },
    },
    { new: true },
  );

  res.json({ success: true, message: "User unblocked successfully", user });
});

exports.depositUSD = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const { amount } = req.query;

  if (!amount) {
    return next(new ErrorResponse("Amount is required", 400));
  }

  // Find user
  const user = await User.findById(userId);
  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }

  const exchangeResp = await exchangeRate();
  const rate = exchangeResp.rate;
  if (!exchangeResp || !exchangeResp.rate) {
    return next(new ErrorResponse("Failed to fetch exchange rate", 500));
  }

  // Convert USD amount to NGN
  const amountInUSD = parseFloat(amount);
  if (isNaN(amountInUSD) || amountInUSD <= 0) {
    return next(new ErrorResponse("Invalid amount", 400));
  }

  const serviceCharge = Number(process.env.USDT_DEPOSIT_FEE) || 0;
  const percentDepositFee = Number(process.env.PERCENT_DEPOSIT_FEE) || 0;

  const percentFee = amountInUSD * (percentDepositFee / 100);

  const totalFeeUSD = serviceCharge + percentFee;
  const totalDebitUSD = amountInUSD + totalFeeUSD;
  const totalDebitNGN = totalDebitUSD * rate;

  console.log({
    rate,
    totalDebitNGN,
    amountInUSD,
    serviceCharge,
    percentDepositFee,
  });

  // Check user balance
  if (user.accountBalance < totalDebitNGN) {
    return next(new ErrorResponse("Insufficient balance", 400));
  }

  // Check if balance after debit will be at least 5000 NGN
  if (user.accountBalance - totalDebitNGN < 5000) {
    return next(
      new ErrorResponse(
        "Your account balance cannot go below 5000 NGN after this transaction",
        400,
      ),
    );
  }

  // Debit user
  user.accountBalance -= totalDebitNGN;
  user.usdtBalance += amountInUSD;
  await user.save();

  const newTrx = await UsdTrx.create({
    amount: amountInUSD,
    user: user._id,
  });

  res.status(200).json({
    success: true,
    message: "USD sent successfully",
    data: { newTrx, accountBalance: user.accountBalance },
  });
});

exports.createUSDTAddress = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  const user = await User.findById(userId);
  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }

  const stringedUserId = user._id.toString();

  const lastSixDigits = stringedUserId.slice(-6).padStart(6, "0");

  const userLabel = `${lastSixDigits}_USDT`;

  const { mode } = req.query;

  try {
    // Call the service function to create a USDT address
    const addressResult = await createUSDTAddress({
      label: userLabel,
      mode,
      vip_key: process.env.STRO_VIP_KEY,
      webhook_url: `https://go-flexi-be-zmy7.onrender.com/webhooks/strowallet`,
    });

    if (!addressResult || !addressResult.address) {
      return next(new ErrorResponse("Failed to create USDT address", 500));
    }

    // Save the address to the user document (customize field name as needed)
    user.usdtAddress = addressResult.address;
    await user.save();

    res.status(200).json({
      success: true,
      message: "USDT address created successfully",
      usdtAddress: addressResult.address,
    });
  } catch (error) {
    console.error("Error creating USDT address:", error);
    return next(new ErrorResponse("Error creating USDT address", 500));
  }
});

exports.checkUSDTStatus = asyncHandler(async (req, res, next) => {
  const { reference } = req.query;

  if (!reference) {
    return next(new ErrorResponse("Reference is required", 400));
  }

  try {
    const result = await checkUSDTTransactionStatus({ reference });

    if (!result) {
      return next(new ErrorResponse("Failed to check USDT status", 500));
    }

    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    console.log("Looking for reference:", reference);
    const trx = await UsdTrx.findOne({ reference: String(reference) });
    console.log("Found trx:", trx);

    // Only increment if transaction exists and belongs to the logged-in user
    if (trx && trx.user.toString() === userId.toString()) {
      console.log(trx.user.toString(), userId.toString());
      const incrementAmount = Number(result.amount) || 0;
      user.usdtBalance = (user.usdtBalance || 0) + incrementAmount;
      await user.save();

      if (result.status && result.status.toLowerCase() === "completed") {
        await trx.deleteOne();
      }
    } else {
      return next(new ErrorResponse("Transaction not found", 404));
    }

    res.status(200).json({
      success: true,
      status: result,
    });
  } catch (error) {
    console.error("Error checking USDT status:", error);
    return next(new ErrorResponse("Error checking USDT status", 500));
  }
});

exports.sendUSDT = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const { amount, mode } = req.query;

  if (!amount) {
    return next(new ErrorResponse("Amount is required", 400));
  }

  // Find user
  const user = await User.findById(userId);
  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }

  const exchangeResp = await exchangeRate();
  const rate = exchangeResp.rate;
  if (!exchangeResp || !exchangeResp.rate) {
    return next(new ErrorResponse("Failed to fetch exchange rate", 500));
  }

  // Convert USD amount to NGN
  const amountInUSD = parseFloat(amount);
  if (isNaN(amountInUSD) || amountInUSD <= 0) {
    return next(new ErrorResponse("Invalid amount", 400));
  }

  const serviceCharge = Number(process.env.USDT_DEPOSIT_FEE) || 0;
  const percentDepositFee = Number(process.env.PERCENT_DEPOSIT_FEE) || 0;

  const percentFee = amountInUSD * (percentDepositFee / 100);

  const totalFeeUSD = serviceCharge + percentFee;
  const totalDebitUSD = amountInUSD + totalFeeUSD;
  const totalDebitNGN = totalDebitUSD * rate;

  console.log({
    rate,
    totalDebitNGN,
    amountInUSD,
    serviceCharge,
    percentDepositFee,
  });

  // Check user balance
  if (user.accountBalance < totalDebitNGN) {
    return next(new ErrorResponse("Insufficient balance", 400));
  }

  // Check if balance after debit will be at least 5000 NGN
  if (user.accountBalance - totalDebitNGN < 5000) {
    return next(
      new ErrorResponse(
        "Your account balance cannot go below 5000 NGN after this transaction",
        400,
      ),
    );
  }

  // Debit user
  user.accountBalance -= totalDebitNGN;
  await user.save();

  try {
    const result = await sendUSDT({
      amount: amountInUSD,
      vip_key: process.env.STRO_VIP_KEY,
      mode,
      address: user.usdtAddress,
    });

    console.log(result);

    if (!result) {
      // Refund user if USDT send fails
      return next(
        new ErrorResponse(result?.message || "Failed to send USDT", 500),
      );
    }

    const newTrx = await UsdTrx.create({
      message: result.message,
      reference: result.reference,
      address: result.address,
      amount: result.amount,
      charge: result.charge,
      user: user._id,
    });

    res.status(200).json({
      success: true,
      message: "USDT in progress",
      reference: result.reference,
    });
  } catch (error) {
    // Refund user if error occurs
    user.accountBalance += totalDebitNGN;
    await user.save();
    console.error("Error sending USDT:", error);
    return next(new ErrorResponse("Error sending USDT", 500));
  }
});

exports.addNumbers = asyncHandler(async (req, res, next) => {
  const userId = req.user?.id;
  if (!userId) {
    return next(new ErrorResponse("Unauthorized", 401));
  }

  const { nin, cac } = req.body;

  if (!nin && !cac) {
    return next(new ErrorResponse("Provide NIN or CAC number to update", 400));
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }

  // Basic validations
  if (nin) {
    const ninTrim = String(nin).trim();
    if (!/^\d{11}$/.test(ninTrim)) {
      return next(new ErrorResponse("Invalid NIN. It must be 11 digits.", 400));
    }
    user.ninNumber = ninTrim;
    user.ninProvided = true;
    // If NIN was not previously verified, keep verified false to require verification step
    if (user.ninVerified !== true) user.ninVerified = false;
  }

  if (cac) {
    const cacTrim = String(cac).trim();
    if (cacTrim.length < 3) {
      return next(new ErrorResponse("Invalid CAC number.", 400));
    }
    user.cacNumber = cacTrim;
    user.cacProvided = true;
    if (user.cacVerified !== true) user.cacVerified = false;
  }

  await user.save();

  // Return updated user (exclude password)
  const updatedUser = await User.findById(userId).select("-password");

  res.status(200).json({
    success: true,
    message: "Identification numbers updated successfully",
    user: updatedUser,
  });
});

exports.migrateUsersToSterling = asyncHandler(async (req, res, next) => {
  const BATCH_SIZE = 5;
  const DELAY_BETWEEN_REQUESTS = 500; // 500ms

  let processed = 0;
  let successful = 0;
  let failed = 0;

  try {
    // --------------------------------------------------
    // 1. Count users that still need migration
    // --------------------------------------------------

    const totalUsers = await User.countDocuments({
      sterlingMigrationStatus: { $ne: "success" },
    });

    console.log("========================================");
    console.log("STERLING ACCOUNT MIGRATION STARTED");
    console.log("========================================");
    console.log(`Users remaining: ${totalUsers}`);
    console.log(`Batch size: ${BATCH_SIZE}`);
    console.log("========================================");

    // --------------------------------------------------
    // 2. Process users in batches
    // --------------------------------------------------

    while (true) {
      const users = await User.find({
        sterlingMigrationStatus: { $ne: "success" },
      })
        .sort({ _id: 1 })
        .limit(BATCH_SIZE);

      // No more users
      if (users.length === 0) {
        break;
      }

      console.log("\n");
      console.log("========================================");
      console.log(`PROCESSING BATCH OF ${users.length}`);
      console.log("========================================");

      // --------------------------------------------------
      // 3. Process each user
      // --------------------------------------------------

      for (const user of users) {
        processed++;

        console.log("\n----------------------------------------");
        console.log(`[${processed}/${totalUsers}] ${user.fullName}`);
        console.log(`Email: ${user.email}`);
        console.log(`Old Account: ${user.accountNumber}`);
        console.log("----------------------------------------");

        // --------------------------------------------------
        // 4. Skip if somehow already migrated
        // --------------------------------------------------

        if (user.sterlingMigrationStatus === "success") {
          console.log("⏭️ Already migrated. Skipping...");
          continue;
        }

        // --------------------------------------------------
        // 5. Validate required user information
        // --------------------------------------------------

        if (!user.fullName || !user.email || !user.phoneNumber) {
          failed++;

          const errorMessage = "Missing fullName, email or phoneNumber";

          console.log(`❌ ${errorMessage}`);

          await User.updateOne(
            { _id: user._id },
            {
              $set: {
                sterlingMigrationStatus: "failed",
                sterlingMigrationError: errorMessage,
              },
            },
          );

          continue;
        }

        // --------------------------------------------------
        // 6. Mark user as processing
        // --------------------------------------------------

        await User.updateOne(
          { _id: user._id },
          {
            $set: {
              sterlingMigrationStatus: "processing",
              sterlingMigrationError: null,
            },
          },
        );

        // --------------------------------------------------
        // 7. Prepare StroWallet payload
        // --------------------------------------------------

        const payload = {
          account_name: user.fullName,
          email: user.email,
          phone: user.phoneNumber,
          public_key: process.env.STROWALLET_PUBLIC_KEY,
          webhook_url:
            "https://go-flexi-be-zmy7.onrender.com/webhooks/strowallet",
        };

        try {
          console.log("Creating Sterling account...");

          // --------------------------------------------------
          // 8. Call StroWallet API
          // --------------------------------------------------

          const response = await axios.post(
            "https://strowallet.com/api/virtual-bank/amucha",
            payload,
            {
              headers: {
                Authorization: `Bearer ${process.env.STROWALLET_PUBLIC_KEY}`,
                "Content-Type": "application/json",
              },
              timeout: 30000,
            },
          );

          const result = response.data;

          console.log("StroWallet response:", result);

          // --------------------------------------------------
          // 9. Check API response
          // --------------------------------------------------

          if (!result.success) {
            failed++;

            const errorMessage =
              result.message || "StroWallet account creation failed";

            console.log(`❌ ${errorMessage}`);

            await User.updateOne(
              { _id: user._id },
              {
                $set: {
                  sterlingMigrationStatus: "failed",
                  sterlingMigrationError: errorMessage,
                },
              },
            );

            continue;
          }

          // --------------------------------------------------
          // 10. Validate returned account information
          // --------------------------------------------------

          if (
            !result.account_number ||
            !result.bank_name ||
            !result.account_name
          ) {
            failed++;

            const errorMessage =
              "StroWallet returned incomplete account details";

            console.log(`❌ ${errorMessage}`);

            await User.updateOne(
              { _id: user._id },
              {
                $set: {
                  sterlingMigrationStatus: "failed",
                  sterlingMigrationError: errorMessage,
                },
              },
            );

            continue;
          }

          // --------------------------------------------------
          // 11. IMPORTANT:
          // Make sure this is actually Sterling Bank
          // --------------------------------------------------

          const returnedBankName = result.bank_name.trim().toLowerCase();

          if (!returnedBankName.includes("sterling")) {
            failed++;

            const errorMessage = `Expected Sterling Bank but received: ${result.bank_name}`;

            console.log(`❌ ${errorMessage}`);

            await User.updateOne(
              { _id: user._id },
              {
                $set: {
                  sterlingMigrationStatus: "failed",
                  sterlingMigrationError: errorMessage,
                },
              },
            );

            continue;
          }

          // --------------------------------------------------
          // 12. Save the old account information
          // --------------------------------------------------

          const previousAccountNumber = user.accountNumber;

          const previousBankName = user.bankName;

          const previousAccountName = user.accountName;

          // --------------------------------------------------
          // 13. Update user with new Sterling account
          // --------------------------------------------------

          await User.updateOne(
            {
              _id: user._id,

              // Prevent accidental overwrite if another
              // process migrated the user simultaneously.
              sterlingMigrationStatus: "processing",
            },
            {
              $set: {
                // New account
                accountNumber: result.account_number,

                bankName: result.bank_name,

                accountName: result.account_name,

                // Migration tracking
                sterlingMigrationStatus: "success",

                sterlingMigrationError: null,

                sterlingAccountCreatedAt: new Date(),

                // Old account information
                previousAccountNumber: previousAccountNumber,

                previousBankName: previousBankName,

                previousAccountName: previousAccountName,
              },
            },
          );

          successful++;

          console.log("\n✅ MIGRATION SUCCESSFUL");
          console.log(`User: ${user.fullName}`);
          console.log(`Old Account: ${previousAccountNumber}`);
          console.log(`New Account: ${result.account_number}`);
          console.log(`Bank: ${result.bank_name}`);
          console.log(`Account Name: ${result.account_name}`);
        } catch (error) {
          failed++;

          const apiError =
            error.response?.data?.message ||
            error.response?.data ||
            error.message ||
            "Unknown StroWallet error";

          console.error(`❌ StroWallet API error for ${user.email}:`, apiError);

          await User.updateOne(
            { _id: user._id },
            {
              $set: {
                sterlingMigrationStatus: "failed",
                sterlingMigrationError:
                  typeof apiError === "string"
                    ? apiError
                    : JSON.stringify(apiError),
              },
            },
          );
        }

        // --------------------------------------------------
        // 14. Delay before next API request
        // --------------------------------------------------

        await new Promise((resolve) =>
          setTimeout(resolve, DELAY_BETWEEN_REQUESTS),
        );
      }

      // --------------------------------------------------
      // 15. Batch summary
      // --------------------------------------------------

      console.log("\n");
      console.log("========================================");
      console.log("BATCH COMPLETED");
      console.log("========================================");
      console.log(`Processed: ${processed}`);
      console.log(`Successful: ${successful}`);
      console.log(`Failed: ${failed}`);
      console.log(
        "Remaining:",
        await User.countDocuments({
          sterlingMigrationStatus: { $ne: "success" },
        }),
      );
      console.log("========================================");
    }

    // --------------------------------------------------
    // 16. Final statistics
    // --------------------------------------------------

    const remaining = await User.countDocuments({
      sterlingMigrationStatus: { $ne: "success" },
    });

    console.log("\n");
    console.log("========================================");
    console.log("STERLING MIGRATION COMPLETED");
    console.log("========================================");
    console.log(`Total processed: ${processed}`);
    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${failed}`);
    console.log(`Remaining: ${remaining}`);
    console.log("========================================");

    return res.status(200).json({
      success: true,
      message: "Sterling account migration completed",
      statistics: {
        totalUsers,
        processed,
        successful,
        failed,
        remaining,
      },
    });
  } catch (error) {
    console.error("Fatal migration error:", error);

    return next(new ErrorResponse("Sterling account migration failed", 500));
  }
});

// exports.batchCreateUSDTAddresses = async (
//   batchSize = 100,
//   concurrency = 10
// ) => {
//   const totalUsers = await User.countDocuments({
//     usdtAddress: { $exists: false },
//   });
//   console.log(`Total users without USDT address: ${totalUsers}`);

//   const pLimit = (await import("p-limit")).default;
//   const limit = pLimit(concurrency); // limits concurrent API calls
//   const totalBatches = Math.ceil(totalUsers / batchSize);

//   for (let batch = 0; batch < totalBatches; batch++) {
//     const users = await User.find({ usdtAddress: { $exists: false } })
//       .skip(batch * batchSize)
//       .limit(batchSize);

//     console.log(
//       `Processing batch ${batch + 1}/${totalBatches} with ${users.length} users`
//     );

//     const promises = users.map((user) =>
//       limit(async () => {
//         try {
//           const stringedUserId = user._id.toString();
//           const lastSixDigits = stringedUserId.slice(-6).padStart(6, "0");
//           const userLabel = `${lastSixDigits}_USDT`;

//           const addressResult = await createUSDTAddress({
//             label: userLabel,
//             vip_key: process.env.STRO_VIP_KEY,
//             webhook_url: `https://go-flexi-be-zmy7.onrender.com/webhooks/strowallet`,
//           });

//           if (addressResult?.address) {
//             user.usdtAddress = addressResult.address;
//             await user.save();
//             console.log(`USDT address created for user ${user._id}`);
//           } else {
//             console.error(`Failed to create USDT address for user ${user._id}`);
//           }
//         } catch (err) {
//           console.error(`Error processing user ${user._id}:`, err.message);
//         }
//       })
//     );

//     await Promise.all(promises);
//   }

//   console.log("Batch processing complete ✅");
// };

// const processUser = async (user) => {
//   try {
//     const users = await User.find({ bankName: "PAGA" });

//     for (const user of users) {
//       try {
//         // Prepare StroWallet payload
//         const payload = {
//           account_name: user.fullName,
//           email: user.email,
//           phone: user.phoneNumber,
//           public_key: process.env.STROWALLET_PUBLIC_KEY,
//           webhook_url: `https://go-flexi-be-zmy7.onrender.com/webhooks/strowallet`,
//         };

//         // Call StroWallet API
//         const response = await axios.post(
//           "https://strowallet.com/api/virtual-bank/amucha/",
//           payload,
//           {
//             headers: {
//               Authorization: `Bearer ${process.env.STROWALLET_PUBLIC_KEY}`,
//               "Content-Type": "application/json",
//             },
//           }
//         );

//         const result = response.data;

//         // If StroWallet fails, stop the process
//         if (!result.success) {
//           return next(
//             new ErrorResponse(result.message || "StroWallet error", 400)
//           );
//         }

//         user.accountNumber = result.account_number;
//         user.bankName = result.bank_name;
//         // user.strowalletAccountId = accountData.account_id;

//         await user.save();
//         console.log(`✅ Updated: ${user.email}`);
//       } catch (err) {
//         console.error(
//           `❌ Error creating account for ${user.email}:`,
//           err.message
//         );
//       }
//     }

//     console.log("🎉 Done processing users");
//   } catch (error) {
//     console.error("Error fetching users:", err.message);
//   }
// };

// exports.processInBatches = asyncHandler(async (req, res, next) => {
//   const CONCURRENCY_LIMIT = 5; // Max parallel API calls
//   const BATCH_SIZE = 100;

//   const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

//   const totalUsers = await User.countDocuments({ bankName: "PAGA" });
//   console.log(`🔎 Found ${totalUsers} PAGA users.`);

//   (async () => {
//     const pLimit = await import("p-limit").then((mod) => mod.default);

//     const limit = pLimit(CONCURRENCY_LIMIT);

//     for (let skip = 0; skip < totalUsers; skip += BATCH_SIZE) {
//       console.log(`📦 Processing batch: ${skip + 1} to ${skip + BATCH_SIZE}`);

//       const users = await User.find({ bankName: "PAGA" })
//         .skip(skip)
//         .limit(BATCH_SIZE);

//       const tasks = users.map((user) => limit(() => processUser(user)));

//       await Promise.all(tasks);

//       // Optional delay between batches to avoid rate limits
//       await sleep(2000); // 2 seconds delay
//     }

//     res.status(200).json({
//       success: true,
//       message: "All batches processed successfully",
//     });
//     console.log("🎉 All batches processed!");
//     // mongoose.connection.close();
//   })();
// });
// exports.getNetAmount = asyncHandler(async (req, res, next) => {
//   const { amount } = req.body;

//   if (typeof amount !== "number") {
//     return next(new ErrorResponse("Amount and fee must be numbers", 400));
//   }

//   const netAmount = calcNetAmount(amount);

//   res.status(200).json({
//     success: true,
//     netAmount,
//   });
// });
