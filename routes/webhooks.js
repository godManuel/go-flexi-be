const express = require("express");
const { stroWallet } = require("../controllers/stro-webhooks.js");
const router = express.Router();

router.post("/strowallet", stroWallet);

module.exports = router;
