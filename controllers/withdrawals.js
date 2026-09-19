const asyncHandler = require("../middlewares/async");
const Claim = require("../models/Claim");
const Withdrawal = require("../models/Withdrawal");
const { generateAuthCode } = require("../utils/generators");
const { sendFundingNotification } = require("../utils/sendEmail");

const MIN = Number(process.env.WITHDRAWAL_MIN) || 2;
const MAX = Number(process.env.WITHDRAWAL_MAX) || 1000;
const AUTH_CODE_TTL_MIN = Number(process.env.AUTH_CODE_EXPIRES_MINUTES) || 15;

const requestWithdrawal = asyncHandler(async (req, res) => {
  const { claimId, amount, accountDetails } = req.body;

  if (amount < MIN || amount > MAX) {
    res.status(400);
    throw new Error(`Withdrawal amount must be between $${MIN} and $${MAX}`);
  }
  if (!accountDetails?.accountNumber || !accountDetails?.bankName) {
    res.status(400);
    throw new Error("Bank name and account number are required");
  }

  const claim = await Claim.findById(claimId);
  if (!claim) {
    res.status(404);
    throw new Error("Claim not found");
  }
  if (String(claim.user) !== String(req.user._id)) {
    res.status(403);
    throw new Error("Not authorized to withdraw against this claim");
  }
  if (claim.status !== "approved") {
    res.status(400);
    throw new Error(
      "Withdrawal is only available once the claim has been approved",
    );
  }

  const existingActive = await Withdrawal.findOne({
    claim: claim._id,
    status: { $in: ["awaiting_confirmation", "confirmed"] },
  });
  if (existingActive) {
    res.status(400);
    throw new Error(
      "There is already an active withdrawal request for this claim",
    );
  }

  // Step 8: generate the one-time Withdrawal Authorization Code
  const authCode = generateAuthCode();
  const authCodeExpiresAt = new Date(
    Date.now() + AUTH_CODE_TTL_MIN * 60 * 1000,
  );

  const withdrawal = await Withdrawal.create({
    user: req.user._id,
    claim: claim._id,
    amount,
    accountDetails,
    authCode,
    authCodeExpiresAt,
    status: "awaiting_confirmation",
  });

  // In production, deliver the code out-of-band (SMS/email) rather than in the response.
  res.status(201).json({
    success: true,
    message: "Withdrawal initiated. Enter the authorization code to confirm.",
    data: {
      withdrawalId: withdrawal._id,
      amount: withdrawal.amount,
      authCode, // demo only — remove from response in production, send via email/SMS instead
      expiresAt: withdrawal.authCodeExpiresAt,
    },
  });
});

// @desc    Step 8 - user confirms the withdrawal by re-submitting the auth
//          code alongside account details and amount. Code is single-use.
// @route   POST /api/withdrawals/:id/confirm
// @access  Private (merchant, owner)
const confirmWithdrawal = asyncHandler(async (req, res) => {
  const { authCode } = req.body;
  const withdrawal = await Withdrawal.findById(req.params.id);

  if (!withdrawal) {
    res.status(404);
    throw new Error("Withdrawal not found");
  }
  if (String(withdrawal.user) !== String(req.user._id)) {
    res.status(403);
    throw new Error("Not authorized to confirm this withdrawal");
  }
  if (withdrawal.status !== "awaiting_confirmation") {
    res.status(400);
    throw new Error(
      `Withdrawal cannot be confirmed (status: ${withdrawal.status})`,
    );
  }
  if (withdrawal.authCodeUsed) {
    res.status(400);
    throw new Error("This authorization code has already been used");
  }
  if (withdrawal.authCodeExpiresAt < new Date()) {
    withdrawal.status = "expired";
    await withdrawal.save();
    res.status(400);
    throw new Error(
      "Authorization code has expired, please request a new withdrawal",
    );
  }
  if (withdrawal.authCode !== authCode) {
    res.status(400);
    throw new Error("Invalid authorization code");
  }
  //   if (Number(amount) !== withdrawal.amount) {
  //     res.status(400);
  //     throw new Error("Amount does not match the original withdrawal request");
  //   }
  //   if (
  //     accountDetails?.accountNumber !== withdrawal.accountDetails.accountNumber
  //   ) {
  //     res.status(400);
  //     throw new Error(
  //       "Account details do not match the original withdrawal request",
  //     );
  //   }

  withdrawal.authCodeUsed = true; // code can only ever be used once
  withdrawal.status = "confirmed";
  await withdrawal.save();

  res.json({
    success: true,
    message: "Withdrawal confirmed, awaiting admin funding",
    data: withdrawal,
  });
});

// @desc    Admin: list withdrawals awaiting manual funding
// @route   GET /api/admin/withdrawals?status=confirmed
const listWithdrawals = asyncHandler(async (req, res) => {
  const { status = "confirmed" } = req.query;
  const withdrawals = await Withdrawal.find({ status })
    .populate("user", "name email usdAccountNumber")
    .sort({ createdAt: 1 });
  res.json({ success: true, count: withdrawals.length, data: withdrawals });
});

// @desc    Step 9 - admin manually funds the account; user is emailed
// @route   PATCH /api/admin/withdrawals/:id/fund
const fundWithdrawal = asyncHandler(async (req, res) => {
  const withdrawal = await Withdrawal.findById(req.params.id).populate("user");
  if (!withdrawal) {
    res.status(404);
    throw new Error("Withdrawal not found");
  }
  if (withdrawal.status !== "confirmed") {
    res.status(400);
    throw new Error(
      `Withdrawal must be confirmed before funding (status: ${withdrawal.status})`,
    );
  }

  withdrawal.status = "funded";
  withdrawal.fundedBy = req.user._id;
  withdrawal.fundedAt = new Date();
  await withdrawal.save();

  try {
    await sendFundingNotification(withdrawal.user, withdrawal);
  } catch (err) {
    // Funding itself should not fail if the email provider hiccups
    console.error("Failed to send funding notification email:", err.message);
  }

  res.json({
    success: true,
    message: "Withdrawal funded and user notified",
    data: withdrawal,
  });
});

module.exports = {
  requestWithdrawal,
  confirmWithdrawal,
  listWithdrawals,
  fundWithdrawal,
};
