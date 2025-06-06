const express = require("express");
const {
  createUser,
  loginUser,
  requestPasswordReset,
  resetPassword,
  verifyPasswordOTP,
} = require("../controllers/auth");
const router = express.Router();

router.post("/signup", createUser);

router.post("/login", loginUser);

// Include route for the password functionality written in auth.js in controllers
router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);

router.route("/verify-otp").post(verifyPasswordOTP);

// router.post("/update-password", updatePassword);
// router.post("/update-profile", updateProfile);
// router.get("/me", protect, getMe);
// router.get("/logout", logoutUser);

module.exports = router;
