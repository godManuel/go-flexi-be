const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middlewares/auth");
const {
  verifyBvn,
  confirmBvn,
  verifyNin,
  verifyCac,
  verifyCorporateBusiness,
} = require("../controllers/kyc");
const upload = require("../utils/multer");

router.post("/verify-bvn", protect, authorize("user"), verifyBvn);
router.post("/confirm-bvn", protect, authorize("user"), confirmBvn);
router.post("/verify-nin", protect, authorize("user"), verifyNin);
router.post("/verify-cac", protect, authorize("user"), verifyCac);
router.post(
  "/verify-corporate-business",
  protect,
  authorize("user"),
   upload.single("image"),
  verifyCorporateBusiness,
);

module.exports = router;
