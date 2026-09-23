const asyncHandler = require("../middlewares/async");
const Application = require("../models/Application");
const User = require("../models/User");
const { uploadDocuments } = require("../utils/cloudinary");
const { generateUsdAccountNumber } = require("../utils/generators");
const { streamApprovedListPdf } = require("../utils/generateApprovedListPdf");

const THRESHOLD = Number(process.env.DWC_APPROVAL_THRESHOLD) || 3000;

const listApplications = asyncHandler(async (req, res) => {
  const { status = "pending" } = req.query;
  const applications = await Application.find({ status })
    .populate("user", "fullName email merchantVerificationCode upgradeType")
    .sort({ createdAt: 1 });
  res.json({ success: true, count: applications.length, data: applications });
});

const submitApplication = asyncHandler(async (req, res) => {
  const files = req.files || {};

  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  console.log(user.cacVerified);
  console.log(user.corporateBiz);

  user.upgradeType = user.cacVerified
    ? "SMEDAN_CAC"
    : user.corporateBiz
      ? "BUSINESS_COOPERATIVE"
      : null;

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

  // Required documents
  const requiredDocuments = [
    {
      field: "signedGrantAcceptanceForm",
      name: "Signed Grant Acceptance Form",
    },
    {
      field: "signedGrantAgreement",
      name: "Signed Grant Agreement",
    },
    {
      field: "signedBeneficiaryDeclaration",
      name: "Signed Beneficiary Declaration",
    },
    {
      field: "signedCodeOfConductAgreement",
      name: "Signed Code of Conduct Agreement",
    },
    {
      field: "signedAntiFraudDeclaration",
      name: "Signed Anti-Fraud Declaration",
    },
    {
      field: "signedConflictOfInterestDeclaration",
      name: "Signed Conflict of Interest Declaration",
    },
  ];

  // Check required documents
  for (const document of requiredDocuments) {
    if (!files[document.field] || files[document.field].length === 0) {
      res.status(400);
      throw new Error(`${document.name} must be uploaded`);
    }
  }

  // Business registration documents are required when CAC is verified
  if (
    user.cacVerified &&
    (!files.businessRegistrationDocuments ||
      files.businessRegistrationDocuments.length === 0)
  ) {
    res.status(400);
    throw new Error("Business registration documents must be uploaded");
  }

  try {
    const documents = [];

    // Upload required documents
    for (const document of requiredDocuments) {
      const file = files[document.field][0];

      const uploaded = await uploadDocuments([file]);

      documents.push({
        documentName: document.name,
        fileName: uploaded[0].fileName,
        url: uploaded[0].url,
        publicId: uploaded[0].publicId,
        resourceType: uploaded[0].resourceType,
        mimeType: uploaded[0].mimeType,
      });
    }

    // Upload business registration documents
    if (files.businessRegistrationDocuments) {
      const uploaded = await uploadDocuments(
        files.businessRegistrationDocuments,
      );

      uploaded.forEach((file) => {
        documents.push({
          documentName: "Business Registration Documents",
          fileName: file.fileName,
          url: file.url,
          publicId: file.publicId,
          resourceType: file.resourceType,
          mimeType: file.mimeType,
        });
      });
    }

    const application = await Application.create({
      user: req.user._id,
      documents,
      status: "pending",
    });

    user.applicationStatus = "pending";

    await user.save();

    res.status(201).json({
      success: true,
      data: application,
    });
  } catch (err) {
    res.status(502);
    throw new Error(`Document upload to Cloudinary failed: ${err.message}`);
  }
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

// @desc    Step 4 - generate/download the current approved-users PDF list
//          for a given upgradeType group
// @route   GET /api/admin/approved-list?upgradeType=SMEDAN_CAC
const getApprovedListPdf = asyncHandler(async (req, res) => {
  const { upgradeType } = req.query;
  if (!["SMEDAN_CAC", "BUSINESS_COOPERATIVE"].includes(upgradeType)) {
    res.status(400);
    throw new Error("upgradeType must be SMEDAN_CAC or BUSINESS_COOPERATIVE");
  }

  const users = await User.find({ upgradeType, isOnApprovedList: true }).sort({
    approvedAt: 1,
  });

  streamApprovedListPdf(res, { upgradeType, users });
});

// @desc    Plain JSON status of both approved lists and threshold progress
// @route   GET /api/admin/approved-list/status
const getApprovedListStatus = asyncHandler(async (req, res) => {
  const groups = ["SMEDAN_CAC", "BUSINESS_COOPERATIVE"];
  const status = {};

  for (const upgradeType of groups) {
    const count = await User.countDocuments({
      upgradeType,
      isOnApprovedList: true,
    });
    status[upgradeType] = {
      approvedCount: count,
      threshold: THRESHOLD,
      claimButtonEnabled: count >= THRESHOLD,
    };
  }

  res.json({ success: true, data: status });
});

module.exports = {
  listApplications,
  submitApplication,
  getMyApplications,
  approveApplication,
  rejectApplication,
  getApprovedListPdf,
  getApprovedListStatus,
};
