const express = require("express");
const {
  requestWithdrawal,
  confirmWithdrawal,
  listWithdrawals,
  listWithdrawal,
} = require("../controllers/withdrawals");
const { protect, authorize } = require("../middlewares/auth");

const router = express.Router();

router.use(protect);

router.post("/", requestWithdrawal);
router.post("/:id/confirm", confirmWithdrawal);
router.get("/", authorize("user"), listWithdrawal);
router.get("/", authorize("admin"), listWithdrawals);

module.exports = router;
