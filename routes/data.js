const express = require("express");
const router = express.Router();
const { checkBlocked } = require("../middlewares/checkBlock");
const { protect, authorize } = require("../middlewares/auth");
const { dataPlans, buyData } = require("../controllers/data");

router.get("/plans", protect, checkBlocked, authorize("user"), dataPlans);

router.post("/purchase", protect, checkBlocked, authorize("user"), buyData);

module.exports = router;
