const express = require("express");
const router = express.Router();
const { checkBlocked } = require("../middlewares/checkBlock");
const { protect, authorize } = require("../middlewares/auth");
const {
  verifyBvn,
  confirmBvn,
  verifyNin,
  verifyCac,
  verifyCorporateBusiness,
} = require("../controllers/kyc");
const upload = require("../utils/multer");

router.post("/verify-bvn", protect, checkBlocked, authorize("user"), verifyBvn);
router.post(
  "/confirm-bvn",
  protect,
  checkBlocked,
  authorize("user"),
  confirmBvn
);
router.post("/verify-nin", protect, checkBlocked, authorize("user"), verifyNin);
router.post("/verify-cac", protect, checkBlocked, authorize("user"), verifyCac);
router.post(
  "/verify-corporate-business",
  protect,
  authorize("user"),
  upload.single("image"),
  verifyCorporateBusiness
);

module.exports = router;
