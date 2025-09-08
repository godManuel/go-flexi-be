// Require express and the User model
const asyncHandler = require("../middlewares/async");
const ErrorResponse = require("../utils/errorResponse");
const { sendEmail } = require("../utils/sendEmail");
const CorporateBiz = require("../models/CorporateBiz.js");
const User = require("../models/User.js");

exports.getCorporateBusinesses = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

exports.updateCorporateBusiness = asyncHandler(async (req, res, next) => {
  const corporateBusinessId = req.params.id;
  const { action } = req.body;

  if (!action) {
    return next(new ErrorResponse("Action is required", 400));
  }

  const corporateBusiness = await CorporateBiz.findById(corporateBusinessId);
  if (!corporateBusiness) {
    return next(new ErrorResponse("Corporate business form not found", 404));
  }

  if (action === "approve") {
    corporateBusiness.status = "verified";
  } else if (action === "decline") {
    corporateBusiness.status = "declined";
  } else {
    return next(new ErrorResponse("Invalid action", 400));
  }
  await corporateBusiness.save();

  // Notify user
  const user = await User.findById(corporateBusiness.userId);
  if (!user) return next(new ErrorResponse("User not found!"));

  if (user) {
    await User.findByIdAndUpdate(
      corporateBusiness.userId,
      {
        $set: {
          isKYC: "verified",
        },
      },
      { new: true }
    );

    await sendEmail(
      user.email,
      `Corporate Business Form ${
        action === "approve" ? "Verified" : "Declined"
      }`,
      "notification",
      {
        name: user.fullName,
        message:
          action === "approve"
            ? "Your corporate business form has been approved."
            : "Your corporate business form has been declined.",
      }
    );
  }

  res.status(200).json({
    success: true,
    message: `Form ${action}d successfully`,
    corporateBusiness,
  });
});
