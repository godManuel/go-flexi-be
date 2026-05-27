const express = require("express");
const {
  getAllTransactions,
  getUserTransactions,
  getTransactionById,
} = require("../controllers/transactions");
const { protect, authorize } = require("../middlewares/auth");
const router = express.Router();

router.get(
  "/transaction/:id",
  protect,
  authorize("user", "admin"),
  getTransactionById,
);
router.get(
  "/:userId",
  protect,
  authorize("user", "admin"),
  getUserTransactions,
);
router.get("/", protect, authorize("admin"), getAllTransactions);

module.exports = router;
