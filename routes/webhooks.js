const express = require("express");
const { stroWallet } = require("../controllers/webhooks");
const router = express.Router();

const { protect } = require("../middlewares/auth");

router.post("/strowallet", protect, stroWallet);

module.exports = router;
