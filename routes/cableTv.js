const express = require("express");
const router = express.Router();
const { checkBlocked } = require("../middlewares/checkBlock");
const { protect, authorize } = require("../middlewares/auth");
const {
  cableTvPlans,
  verifySmartCard,
  requestCableTvSubscription,
} = require("../controllers/cableTv");

router.get("/plans", protect, checkBlocked, authorize("user"), cableTvPlans);
router.post(
  "/verify-smartcard",
  protect,
  checkBlocked,
  authorize("user"),
  verifySmartCard
);
router.post(
  "/subscribe",
  protect,
  checkBlocked,
  authorize("user"),
  requestCableTvSubscription
);

module.exports = router;
