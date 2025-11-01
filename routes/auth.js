const express = require("express");
const {
  createUser,
  loginUser,
  requestPasswordReset,
  resetPassword,
  verifyLoginOTP,
  verifyPasswordOTP,
} = require("../controllers/auth");
const User = require("../models/User");
const advancedResults = require("../middlewares/advancedResults");
const router = express.Router();

router.post("/signup", createUser);

router.post(
  "/login",
  advancedResults(User, { path: "corporateBiz" }),
  loginUser
);

// Include route for the password functionality written in auth.js in controllers
router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);

router.route("/verify-password-otp").post(verifyPasswordOTP);

// @POST - Verify Login OTP
router.route("/verify-login-otp").post(verifyLoginOTP);

// router.post("/update-password", updatePassword);
// router.post("/update-profile", updateProfile);
// router.get("/me", protect, getMe);
// router.get("/logout", logoutUser);

module.exports = router;
