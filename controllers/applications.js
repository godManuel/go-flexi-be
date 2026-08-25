const asyncHandler = require("../middlewares/async");
const Application = require("../models/Application");
const User = require("../models/User");
const { uploadDocuments } = require("../utils/cloudinary");
const { generateUsdAccountNumber } = require("../utils/generators");

const THRESHOLD = Number(process.env.DWC_APPROVAL_THRESHOLD) || 3000;

const listApplications = asyncHandler(async (req, res) => {
  const { status = "pending" } = req.query;
  const applications = await Application.find({ status })
    .populate("user", "name email dwcCode upgradeType")
    .sort({ createdAt: 1 });
  res.json({ success: true, count: applications.length, data: applications });
});

const submitApplication = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error("At least one document must be uploaded");
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.upgradeType = user.cacVerified ? "SMEDAN_CAC" : "BUSINESS_COOPERATIVE";

  const existingPending = await Application.findOne({
    user: req.user._id,
    status: "pending",
  });
  if (existingPending) {
    res.status(400);
    throw new Error(
      "You already have a pending application awaiting admin review",
    );
  }

  // req.files hold each buffer in memory (multer memoryStorage) - stream
  // each one to Cloudinary and use the returned secure URLs.
  let documents;
  try {
    documents = await uploadDocuments(req.files);
  } catch (err) {
    res.status(502);
    throw new Error(`Document upload to Cloudinary failed: ${err.message}`);
  }

  const application = await Application.create({
    user: req.user._id,
    documents,
    status: "pending",
  });

  req.user.applicationStatus = "pending";
  await req.user.save();

  res.status(201).json({ success: true, data: application });
});

const getMyApplications = asyncHandler(async (req, res) => {
  const applications = await Application.find({ user: req.user._id }).sort({
    createdAt: -1,
  });
  res.json({ success: true, data: applications });
});

const approveApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id).populate(
    "user",
  );
  if (!application) {
    res.status(404);
    throw new Error("Application not found");
  }
  if (application.status !== "pending") {
    res.status(400);
    throw new Error(`Application already ${application.status}`);
  }

  application.status = "approved";
  application.reviewedBy = req.user._id;
  application.reviewedAt = new Date();
  await application.save();

  const user = application.user;

  // Step 3: generate internal USD account number
  user.usdAccountNumber = generateUsdAccountNumber();
  user.applicationStatus = "approved";

  // Step 4: add user to the approved PDF list (their upgradeType group)
  user.isOnApprovedList = true;
  user.approvedAt = new Date();
  await user.save();

  // Step 5: recompute count for this user's list type; enable claim button
  // for the whole group once the count reaches the threshold.
  const approvedCount = await User.countDocuments({
    isOnApprovedList: true,
    upgradeType: user.upgradeType,
  });

  let claimJustEnabled = false;
  if (approvedCount >= THRESHOLD) {
    const result = await User.updateMany(
      {
        upgradeType: user.upgradeType,
        isOnApprovedList: true,
        claimEnabled: false,
      },
      { $set: { claimEnabled: true } },
    );
    claimJustEnabled = result.modifiedCount > 0;
  }

  res.json({
    success: true,
    message:
      "Application approved, USD account generated, user added to approved list",
    data: {
      applicationId: application._id,
      userId: user._id,
      usdAccountNumber: user.usdAccountNumber,
      upgradeType: user.upgradeType,
      approvedCountForGroup: approvedCount,
      threshold: THRESHOLD,
      claimButtonEnabledForGroup: approvedCount >= THRESHOLD,
      claimJustEnabledByThisApproval: claimJustEnabled,
    },
  });
});

// @desc    Step 2 (reject path)
// @route   PATCH /api/admin/applications/:id/reject
const rejectApplication = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const application = await Application.findById(req.params.id).populate(
    "user",
  );
  if (!application) {
    res.status(404);
    throw new Error("Application not found");
  }
  if (application.status !== "pending") {
    res.status(400);
    throw new Error(`Application already ${application.status}`);
  }

  application.status = "rejected";
  application.reviewedBy = req.user._id;
  application.reviewedAt = new Date();
  application.rejectionReason = reason || "Not specified";
  await application.save();

  application.user.applicationStatus = "rejected";
  application.user.rejectionReason = reason || "Not specified";
  await application.user.save();

  // Best-effort cleanup of the rejected documents on Cloudinary; a failure
  // here shouldn't block the rejection itself.
  await Promise.allSettled(
    application.documents.map((doc) =>
      doc.publicId
        ? deleteDocument(doc.publicId, doc.resourceType)
        : Promise.resolve(),
    ),
  );

  res.json({
    success: true,
    message: "Application rejected and documents removed from storage",
    data: application,
  });
});

module.exports = {
  listApplications,
  submitApplication,
  getMyApplications,
  approveApplication,
  rejectApplication,
};
