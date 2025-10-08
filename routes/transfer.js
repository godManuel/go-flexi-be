const express = require("express");
const { bankTransfer, checkAccountName } = require("../controllers/transfer");
const { checkBlocked } = require("../middlewares/checkBlock");
const { protect, authorize } = require("../middlewares/auth");
const enforceMerchantUsdt = require("../middlewares/merchant");
const router = express.Router();

router.post("/", protect, checkBlocked, enforceMerchantUsdt, bankTransfer);
router.get("/check-account-name", checkAccountName);

module.exports = router;
