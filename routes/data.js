const express = require("express");
const router = express.Router();
const { checkBlocked } = require("../middlewares/checkBlock");
const { protect, authorize } = require("../middlewares/auth");
const { dataPlans, buyData } = require("../controllers/data");
const enforceMerchantUsdt = require("../middlewares/merchant");

router.get(
  "/plans",
  protect,
  checkBlocked,
  enforceMerchantUsdt,
  authorize("user"),
  dataPlans
);

router.post(
  "/purchase",
  protect,
  checkBlocked,
  enforceMerchantUsdt,
  authorize("user"),
  buyData
);

module.exports = router;
