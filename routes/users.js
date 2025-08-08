// Require express and the User model
const express = require("express");

const {
  getUser,
  getAllUsers,
  creditUserBalance,
  debitUserBalance,
  createAdmin,
  getUserTransactions,
  getAllUserTransactions,
  sendNotificationToUsers,
  sendNotificationToUser,
  getNetAmount,
  addBeneficiary
} = require("../controllers/users");
const { protect, authorize } = require("../middlewares/auth");

const router = express.Router();

router.get("/:id", protect, getUser);
router.get("/", protect, authorize("admin"), getAllUsers);
router.put("/credit-balance", protect, authorize("admin"), creditUserBalance);
router.put("/debit-balance", protect, authorize("admin"), debitUserBalance);
router.post("/create-admin", createAdmin);

router.get("/:id/transactions", protect, getUserTransactions);

router.get('/transactions', protect, authorize('admin'), getAllUserTransactions)

router.post("/notify-all", protect, authorize('admin'), sendNotificationToUsers)

router.post("/notify", protect, authorize('admin'), sendNotificationToUser);

router.post('/add-beneficiary', addBeneficiary)

// router.post("/get-net-amount", getNetAmount);
// router.post("/process-batches", processInBatches);


module.exports = router;
