const asyncHandler = require("../middlewares/asyncHandler");
const Claim = require("../models/Claim");
const User = require("../models/User");
const { generateClaimNumber } = require("../utils/generators");

// @desc    Check whether the claim button is enabled for the logged-in user
// @route   GET /api/claims/status
// @access  Private (merchant)
const getClaimStatus = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      claimEnabled: req.user.claimEnabled,
      isOnApprovedList: req.user.isOnApprovedList,
      upgradeType: req.user.upgradeType,
    },
  });
});

// @desc    Step 6 (part 1) - user clicks the claim button, a unique claim
//          number is generated and returned.
// @route   POST /api/claims
// @access  Private (merchant)
const createClaim = asyncHandler(async (req, res) => {
  if (!req.user.claimEnabled) {
    res.status(403);
    throw new Error("Claim button is not enabled for you yet");
  }

  const existing = await Claim.findOne({
    user: req.user._id,
    status: { $in: ["awaiting_submission", "pending"] },
  });
  if (existing) {
    res.status(400);
    throw new Error("You already have an active claim in progress");
  }

  const claim = await Claim.create({
    user: req.user._id,
    claimNumber: generateClaimNumber(),
    status: "awaiting_submission",
  });

  res.status(201).json({ success: true, data: claim });
});

// @desc    Step 6 (part 2) - user submits the claim number + other details
//          for admin approval/decline.
// @route   POST /api/claims/:id/submit
// @access  Private (merchant, owner of the claim)
const submitClaimDetails = asyncHandler(async (req, res) => {
  const { claimNumber } = req.body;
  const claim = await Claim.findById(req.params.id);

  if (!claim) {
    res.status(404);
    throw new Error("Claim not found");
  }
  if (String(claim.user) !== String(req.user._id)) {
    res.status(403);
    throw new Error("Not authorized to modify this claim");
  }
  if (claim.claimNumber !== claimNumber) {
    res.status(400);
    throw new Error("Claim number does not match");
  }
  if (claim.status !== "awaiting_submission") {
    res.status(400);
    throw new Error(`Claim already ${claim.status}`);
  }

  // claim.details = details;
  claim.status = "pending";
  await claim.save();

  res.json({
    success: true,
    message: "Claim submitted for admin review",
    data: claim,
  });
});

// @desc    Admin: list claims pending review
// @route   GET /api/admin/claims?status=pending
const listClaims = asyncHandler(async (req, res) => {
  const { status = "pending" } = req.query;
  const claims = await Claim.find({ status })
    .populate("user", "name email upgradeType usdAccountNumber")
    .sort({ createdAt: 1 });
  res.json({ success: true, count: claims.length, data: claims });
});

// @desc    Step 6 (admin decision) - approve
// @route   PATCH /api/admin/claims/:id/approve
const approveClaim = asyncHandler(async (req, res) => {
  const claim = await Claim.findById(req.params.id);
  if (!claim) {
    res.status(404);
    throw new Error("Claim not found");
  }
  if (claim.status !== "pending") {
    res.status(400);
    throw new Error(`Claim is not pending (currently ${claim.status})`);
  }

  claim.status = "approved";
  claim.reviewedBy = req.user._id;
  claim.reviewedAt = new Date();
  await claim.save();

  res.json({
    success: true,
    message: "Claim approved. Withdrawal button can now be shown to the user.",
    data: claim,
  });
});

// @desc    Step 6 (admin decision) - decline
// @route   PATCH /api/admin/claims/:id/decline
const declineClaim = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const claim = await Claim.findById(req.params.id);
  if (!claim) {
    res.status(404);
    throw new Error("Claim not found");
  }
  if (claim.status !== "pending") {
    res.status(400);
    throw new Error(`Claim is not pending (currently ${claim.status})`);
  }

  claim.status = "declined";
  claim.declineReason = reason || "Not specified";
  claim.reviewedBy = req.user._id;
  claim.reviewedAt = new Date();
  await claim.save();

  res.json({ success: true, message: "Claim declined", data: claim });
});

module.exports = {
  getClaimStatus,
  createClaim,
  submitClaimDetails,
  listClaims,
  approveClaim,
  declineClaim,
};
