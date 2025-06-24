const express = require('express');
const router = express.Router();
const { broadcastNotification } = require('../controllers/notification');
const { protect, authorize } = require("../middlewares/auth");

router.post('/', protect, authorize('admin'), broadcastNotification);

module.exports = router;
