const express = require("express");
const { createAccount } = require("../controllers/webhooks");
const router = express.Router();

router.get("/create-account", createAccount);

module.exports = router;
