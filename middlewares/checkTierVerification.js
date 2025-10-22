const ErrorResponse = require("../utils/errorResponse");

exports.checkTierVerification = (req, res, next) => {
  const { user } = req;
  if (!user) {
    return res.status(401).json({ message: "Unauthorized. User not found." });
  }

  const { tier, ninVerified, ninProvided, cacVerified, cacProvided } = user;

  // --- Business Tier Check ---
  if (tier === "business") {
    // Ensure NIN is verified before checking if NIN was provided
    if (ninVerified !== true) {
      return next(new ErrorResponse("Please verify your NIN to continue", 400));
    }

    if (!ninProvided) {
      return next(
        new ErrorResponse("Please input your NIN number to continue", 400)
      );
    }
  }

  // --- Merchant Tier Check ---
  if (tier === "merchant") {
    // Ensure CAC is verified before checking if CAC was provided
    if (cacVerified !== true) {
      return next(new ErrorResponse("Please verify your CAC to continue", 400));
    }

    if (!cacProvided) {
      return next(
        new ErrorResponse("Please input your CAC number to continue", 400)
      );
    }

    if (!cacProvided && !ninProvided) {
      return next(
        new ErrorResponse("Please input your CAC & NIN number to continue", 400)
      );
    }
  }

  next();
};
