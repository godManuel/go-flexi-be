const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const { dataPlans, buyData } = require('../controllers/data');

router.get('/plans', protect, authorize('user'), dataPlans);
router.post('/purchase', protect, authorize("user"), buyData)

module.exports = router;