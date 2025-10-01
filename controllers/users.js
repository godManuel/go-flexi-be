// Require express and the User model
const User = require("../models/User");
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
    "-password"
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

  // Send credit alert email
  try {
    await sendEmail(
      user.email,
      "Credit Alert",
      "credit-alert", // View name
      {
        name: user.fullName,
        amount: amount,
        date: new Date().toLocaleDateString(),
        balance: user.accountBalance,
      }
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
      }
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
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  const deposits = await Deposit.find({ user: userId }).lean();
  const transfers = await Transfer.find({ user: userId }).lean();

  // Format deposits with fee calculation
  const formattedDeposits = deposits.map((d) => {
    const { netAmount, totalFee } = calcNetAmount(d.settledAmount); // use your fee function

    return {
      _id: d._id,
      type: "deposit",
      grossAmount: d.amount,
      netAmount,
      feeCharged: totalFee,
      createdAt: d.createdAt,
    };
  });

  const formattedTransfers = transfers.map((t) => ({
    _id: t._id,
    type: "transfer",
    amount: t.amount,
    to: t.to,
    createdAt: t.createdAt,
  }));

  const transactions = [...formattedDeposits, ...formattedTransfers].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  res.json({ user, transactions });
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

  const users = await User.find({ role: "user" });

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
        b.bankName.toLowerCase().trim() === bank_name.toLowerCase().trim()
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
      bank.bankName.toLowerCase().trim() === bank_name.toLowerCase().trim()
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
    { new: true }
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
    { new: true }
  );

  res.json({ success: true, message: "User unblocked successfully", user });
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
  const { amount, vip_key, mode, address } = req.query;

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
        400
      )
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

    if (!result) {
      // Refund user if USDT send fails
      return next(
        new ErrorResponse(result?.message || "Failed to send USDT", 500)
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
