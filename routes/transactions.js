const express = require("express");
const { getAllTransactions } = require("../controllers/transactions");
const { protect, authorize } = require("../middlewares/auth");
const router = express.Router();

router.get("/", protect, authorize("admin"), getAllTransactions);

module.exports = router;
