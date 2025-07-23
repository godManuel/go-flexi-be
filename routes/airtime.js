const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const { buyAirtime } = require('../controllers/airtime');

router.post("/purchase", protect, authorize('user'), buyAirtime)

module.exports = router;