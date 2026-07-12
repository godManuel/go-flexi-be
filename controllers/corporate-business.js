// Require express and the User model
const asyncHandler = require("../middlewares/async");
const ErrorResponse = require("../utils/errorResponse");
const { sendEmail } = require("../utils/sendEmail");
const CorporateBiz = require("../models/CorporateBiz.js");
const User = require("../models/User.js");

// POST /api/corporate-biz/add
exports.addCooperative = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  const cooperative = await CorporateBiz.create({
    ...req.body,
    user: user._id,
    purpose: "additional",
    status: "verified",
  });

  user.cooperatives.push(cooperative._id);
  await user.save();

  res.status(201).json({ success: true, data: cooperative });
});

exports.getCorporateBusinesses = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

exports.updateCorporateBusiness = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { action } = req.body;

  if (!action) {
    return next(new ErrorResponse("Action is required", 400));
  }

  // Find corporate business form
  const corporateBusiness = await CorporateBiz.findById(id);
  if (!corporateBusiness) {
    return next(new ErrorResponse("Corporate business form not found", 404));
  }

  // Handle approval or decline
  if (action === "approve") {
    corporateBusiness.status = "verified";

    // Generate unique 7-digit merchant code
    let uniqueCode;
    let codeExists;
    do {
      uniqueCode = Math.floor(1000000 + Math.random() * 9000000);
      codeExists = await User.exists({ merchantVerificationCode: uniqueCode });
    } while (codeExists);

    // Persist changes to user (ensure it saves correctly)
    const updatedUser = await User.findByIdAndUpdate(
      corporateBusiness.user, // make sure `userId` exists in CorporateBiz schema
      {
        $set: {
          merchantVerificationCode: uniqueCode,
          tier: "merchant",
          isKYC: "verified",
        },
      },
      { new: true, runValidators: true },
    );

    if (!updatedUser) {
      return next(new ErrorResponse("Associated user not found", 404));
    }

    await corporateBusiness.save();
  } else if (action === "decline") {
    corporateBusiness.status = "declined";
    await corporateBusiness.save();
  } else {
    return next(new ErrorResponse("Invalid action", 400));
  }

  // Notify user
  const user = await User.findById(
    corporateBusiness.userId || corporateBusiness.user,
  );
  if (!user) return next(new ErrorResponse("User not found!", 404));

  await sendEmail(
    user.email,
    `Corporate Business Form ${action === "approve" ? "Verified" : "Declined"}`,
    "notification",
    {
      name: user.fullName,
      message:
        action === "approve"
          ? "Your corporate business form has been approved."
          : "Your corporate business form has been declined.",
    },
  );

  return res.status(200).json({
    success: true,
    message: `Form ${action}d successfully`,
    corporateBusiness,
  });
});
