const express = require("express");
const { bankTransfer, checkAccountName } = require("../controllers/transfer");
const { checkBlocked } = require("../middlewares/checkBlock");
const { protect, authorize } = require("../middlewares/auth");
const router = express.Router();

// router.post("/", protect, checkBlocked, bankTransfer);
router.get("/check-account-name", checkAccountName);

module.exports = router;
