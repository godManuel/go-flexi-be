const express = require("express");
const { stroWallet } = require("../controllers/webhooks");
const router = express.Router();

// const { protect } = require("../middlewares/auth");

router.post("/strowallet", stroWallet);

module.exports = router;
