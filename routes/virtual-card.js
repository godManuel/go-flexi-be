const express = require("express");
const {
  createVUSDCard,
  getExchangeRate,
  fundVUSDCard,
  withdrawFromVUSDCard,
  cardTransactions,
  cardDetails,
} = require("../controllers/virtual-card");
const { protect, authorize } = require("../middlewares/auth");

const router = express.Router();

router.post("/create-usd", protect, authorize("user"), createVUSDCard);
router.get("/exchange-rate", protect, authorize("user"), getExchangeRate);
router.post("/fund-usd", protect, authorize("user"), fundVUSDCard);
router.post("/withdraw-usd", protect, authorize("user"), withdrawFromVUSDCard);
router.post("/card-transactions", protect, authorize("user"), cardTransactions);
router.post("/card-details", protect, authorize("user"), cardDetails);

module.exports = router;
