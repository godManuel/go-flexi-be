const express = require("express");
const router = express.Router();
const { checkBlocked } = require("../middlewares/checkBlock");
const { protect, authorize } = require("../middlewares/auth");
const {
  verifyMeter,
  purchaseElectricity,
} = require("../controllers/electricity");

router.get(
  "/verify-meter",
  protect,
  checkBlocked,
  authorize("user"),
  verifyMeter
);

router.post(
  "/purchase",
  protect,
  checkBlocked,
  authorize("user"),
  purchaseElectricity
);

module.exports = router;
