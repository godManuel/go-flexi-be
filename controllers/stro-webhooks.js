const { verifySessionId } = require("../services/stroWalletService");
const User = require("../models/User");
const Deposit = require("../models/Deposit");
const ErrorResponse = require("../utils/errorResponse");
const { calcNetAmount } = require("../utils/calcNetAmount");
const { sendEmail } = require("../utils/sendEmail");
const asyncHandler = require("../middlewares/async");

exports.stroWallet = asyncHandler(async (req, res, next) => {
  const {
    accountNumber,
    transactionAmount,
    sessionId,
    tranRemarks,
    settledAmount,
    feeAmount,
    vatAmount,
    currency,
    initiationTranRef,
    settlementId,
    sourceAccountNumber,
    sourceAccountName,
    sourceBankName,
    channelId,
    tranDateTime,
  } = req.body;

  try {
    const verificationData = await verifySessionId(
      transactionAmount,
      sessionId
    );
    console.log("Verification:", verificationData);

    if (verificationData) {
      let user = await User.findOne({ accountNumber: accountNumber });
      if (!user) return next(new ErrorResponse("Not account owner!", 400));

      const deposit = await Deposit.create({
        sessionId: sessionId,
        accountNumber: accountNumber,
        tranRemarks: tranRemarks,
        transactionAmount: transactionAmount,
        settledAmount: settledAmount,
        feeAmount: feeAmount,
        vatAmount: vatAmount,
        currency: currency,
        initiationTranRef: initiationTranRef,
        settlementId: settlementId,
        sourceAccountNumber: sourceAccountNumber,
        sourceAccountName: sourceAccountName,
        sourceBankName: sourceBankName,
        channelId: channelId,
        tranDateTime: tranDateTime,
        user,
      });

      const { netAmount } = calcNetAmount(deposit.settledAmount);

      const newAcctBal = (parseFloat(user.accountBalance) + netAmount).toFixed(
        2
      );

      const updatedUser = await User.findOneAndUpdate(
        { _id: user.id },
        { $set: { accountBalance: newAcctBal } },
        { new: true }
      );

      await Transaction.create({
        user: user._id,
        type: "deposit",
        amount: +netAmount,
        deposit: deposit._id,
        description: deposit.tranRemarks || "Account Deposit",
        balanceAfter: +newAcctBal,
        date: deposit.tranDateTime,
      });

      user.transactions.push(deposit._id);
      await user.save();

      // Send credit alert email
      try {
        await sendEmail(
          user.email,
          "Credit Alert",
          "credit-alert", // View name
          {
            name: user.fullName,
            amount: netAmount,
            date: new Date(deposit.tranDateTime).toLocaleDateString(),
            balance: newAcctBal,
          }
        );
      } catch (error) {
        console.error("Failed to send credit alert email:", error);
        // Optionally, continue without failing the request
      }

      console.log(updatedUser);
      res.status(201).json({ status: "success", updatedUser });
    } else {
      console.log("Verification failed:", verificationData);
      return next(new ErrorResponse("Verification failed", 400));
    }
  } catch (error) {
    const apiError = error.response?.data || error.message;
    return next(
      new ErrorResponse(
        `StroWallet session verification failed: ${JSON.stringify(apiError)}`
      )
    );
  }
});
