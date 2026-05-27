const express = require("express");
const { getAllTransactions, getUserTransactions } = require("../controllers/transactions");
const { protect, authorize } = require("../middlewares/auth");
const router = express.Router();

router.get("/:userId", protect, authorize("user", "admin"), getUserTransactions);
router.get("/", protect, authorize("admin"), getAllTransactions);

module.exports = router;
