const express = require("express");
const {
  requestWithdrawal,
  confirmWithdrawal,
} = require("../controllers/withdrawals");
const { protect, authorize } = require("../middlewares/auth");

const router = express.Router();

router.use(protect);

router.post("/", requestWithdrawal);
router.post("/:id/confirm", confirmWithdrawal);

module.exports = router;
