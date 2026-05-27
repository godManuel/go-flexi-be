const express = require("express");
const router = express.Router();
const { buyAirtime } = require("../../controllers/airtime");
const apiKeyAuth = require("../../middlewares/apiKeyAuth");
const attachApiUser = require("../../middlewares/attachApiUser");
const apiRateLimit = require("../../middlewares/apiRateLimit");
const trackApiUsage = require("../../middlewares/trackApiUsage");

router.post(
  "/purchase",
  apiRateLimit,
  apiKeyAuth,
  attachApiUser,
  trackApiUsage,
  buyAirtime,
);

module.exports = router;
