const express = require("express");
const { createAccount } = require("../controllers/webhooks");
const router = express.Router();

router.post("/create-account", createAccount);

module.exports = router;
