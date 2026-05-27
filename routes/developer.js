const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/auth");

const {
  createApiKey,
  getApiKeys,
  revokeApiKey,
} = require("../controllers/developer");

router.post("/keys", protect, createApiKey);

router.get("/keys", protect, getApiKeys);

router.delete("/keys/:id", protect, revokeApiKey);

module.exports = router;
