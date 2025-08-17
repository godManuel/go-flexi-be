const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const { verifyBvn, confirmBvn, verifyNin, verifyCac } = require('../controllers/kyc');

router.post('/verify-bvn', protect, authorize('user'), verifyBvn);
router.post('/confirm-bvn', protect, authorize('user'), confirmBvn);
router.post('/verify-nin', protect, authorize('user'), verifyNin);
router.psot("/verify-cac", protect, authorize("user"), verifyCac)

module.exports = router;