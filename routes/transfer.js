const express = require("express");
const { bankTransfer } = require("../controllers/transfer");
const { protect, authorize } = require("../middlewares/auth");
const router = express.Router();

router.post("/", protect, bankTransfer);

module.exports = router;
