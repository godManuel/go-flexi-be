const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const { verifyBvn, confirmBvn, verifyNin } = require('../controllers/kyc');

router.post('/verify-bvn', protect, authorize('user'), verifyBvn);
router.post('/confirm-bvn', protect, authorize('user'), confirmBvn);
router.post('/verify-nin', protect, authorize('user'), verifyNin);

module.exports = router;