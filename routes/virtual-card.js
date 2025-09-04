const express = require("express");
const {
  createVUSDCard,
  getExchangeRate,
  fundVUSDCard,
  withdrawFromVUSDCard,
  cardTransactions,
  cardDetails,
} = require("../controllers/virtual-card");
const { checkBlocked } = require("../middlewares/checkBlock");
const { protect, authorize } = require("../middlewares/auth");

const router = express.Router();

router.post(
  "/create-usd",
  protect,
  checkBlocked,
  authorize("user"),
  createVUSDCard
);
router.get(
  "/exchange-rate",
  protect,
  checkBlocked,
  authorize("user"),
  getExchangeRate
);
router.post(
  "/fund-usd",
  protect,
  checkBlocked,
  authorize("user"),
  fundVUSDCard
);
router.post(
  "/withdraw-usd",
  protect,
  checkBlocked,
  authorize("user"),
  withdrawFromVUSDCard
);
router.post(
  "/card-transactions",
  protect,
  checkBlocked,
  authorize("user"),
  cardTransactions
);
router.post(
  "/card-details",
  protect,
  checkBlocked,
  authorize("user"),
  cardDetails
);

module.exports = router;
