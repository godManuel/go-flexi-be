const express = require("express");
const router = express.Router();
const { checkBlocked } = require("../middlewares/checkBlock");
const { protect, authorize } = require("../middlewares/auth");
const { buyAirtime } = require("../controllers/airtime");
const enforceMerchantUsdt = require("../middlewares/merchant");

router.post(
  "/purchase",
  protect,
  checkBlocked,
  enforceMerchantUsdt,
  authorize("user"),
  buyAirtime
);

module.exports = router;
