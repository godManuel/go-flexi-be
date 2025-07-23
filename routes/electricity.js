const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const { verifyMeter, purchaseElectricity } = require("../controllers/electricity");

router.get('/verify-meter', protect, authorize("user"), verifyMeter);
router.post('/purchase', protect, authorize("user"), purchaseElectricity);