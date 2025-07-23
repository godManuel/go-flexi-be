const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const { cableTvPlans } = require("../controllers/cableTv")

router.get('/plans', protect, authorize("user"), cableTvPlans)
router.post('/verify-smartcard', protect, authorize("user"), verifySmartCard);
router.post('/subscribe', protect, authorize("user"), requestCableTvSubscription);

module.exports = router;