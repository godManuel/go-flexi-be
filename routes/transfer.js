const express = require("express");
const { bankTransfer, checkAccountName } = require("../controllers/transfer");
const { protect, authorize } = require("../middlewares/auth");
const router = express.Router();

router.post("/", protect, bankTransfer);
router.get('/check-account-name', checkAccountName);

module.exports = router;
