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
  addBeneficiary,
  getUserByEmail,
} = require("../controllers/users");
const { protect, authorize } = require("../middlewares/auth");

const router = express.Router();

// Users endpoints (router 1 & 2: users, router 3: admin)
router.get("/:id", protect, getUser);
router.get("/", protect, authorize("admin"), getAllUsers);
router.post("/user", protect, authorize("admin"), getUserByEmail);

// Update Balance endpoints (All routers are admin only)
router.put("/credit-balance", protect, authorize("admin"), creditUserBalance);
router.put("/debit-balance", protect, authorize("admin"), debitUserBalance);

// Admin endpoint (For superadmin)
router.post("/create-admin", createAdmin);

// Transactions endpoints (router 1: user, router 2: admin)
router.get("/:id/transactions", protect, getUserTransactions);
router.get(
  "/transactions",
  protect,
  authorize("admin"),
  getAllUserTransactions
);

// Notification endpoints (All routers are admin only)
router.post(
  "/notify-all",
  protect,
  authorize("admin"),
  sendNotificationToUsers
);

router.post("/notify", sendNotificationToUser);

// Beneficiary endpoint (User only)
router.post("/add-beneficiary", protect, authorize("user"), addBeneficiary);

// router.post("/get-net-amount", getNetAmount);
// router.post("/process-batches", processInBatches);

module.exports = router;
