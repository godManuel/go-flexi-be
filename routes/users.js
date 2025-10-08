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
  blockUser,
  unblockUser,
  createUSDTAddress,
  sendUSDT,
  depositUSD,
  checkUSDTStatus,
  getUserTransaction,
} = require("../controllers/users");
const { checkBlocked } = require("../middlewares/checkBlock");
const { protect, authorize } = require("../middlewares/auth");
const User = require("../models/User");
const advancedResults = require("../middlewares/advancedResults");
const enforceMerchantUsdt = require("../middlewares/merchant");

const router = express.Router();

// Users endpoints (router 1 & 2: users, router 3: admin)
router.get("/:id", protect, checkBlocked, getUser);
router.get(
  "/",
  protect,
  authorize("admin"),
  advancedResults(User, { path: "corporateBiz" }),
  getAllUsers
);
router.post("/user", protect, authorize("admin"), getUserByEmail);

// Update Balance endpoints (All routers are admin only)
router.put("/credit-balance", protect, authorize("admin"), creditUserBalance);
router.put("/debit-balance", protect, authorize("admin"), debitUserBalance);

// Admin endpoint (For superadmin)
router.post("/create-admin", createAdmin);

// Transactions endpoints (router 1: user, router 2: admin)
router.get(
  "/:userId/transactions",
  protect,
  enforceMerchantUsdt,
  getUserTransactions
);
router.get(
  "/transactions",
  protect,
  enforceMerchantUsdt,
  getAllUserTransactions
);

router.get(
  "/transactions/:transactionId",
  protect,
  authorize("user", "admin"),
  checkBlocked,
  enforceMerchantUsdt,
  getUserTransaction
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
router.post(
  "/add-beneficiary",
  protect,
  checkBlocked,
  authorize("user"),
  enforceMerchantUsdt,
  addBeneficiary
);

router.put("/:id/block", protect, authorize("admin"), blockUser);

router.put("/:id/unblock", protect, authorize("admin"), unblockUser);

router.post(
  "/create-usdt-address",
  protect,
  checkBlocked,
  authorize("user"),
  createUSDTAddress
);

router.post("/send-usdt", protect, checkBlocked, authorize("user"), sendUSDT);

router.post(
  "/deposit-usd",
  protect,
  checkBlocked,
  authorize("user"),
  depositUSD
);

router.get(
  "/user/usdt-status",
  protect,
  authorize("user"),
  checkBlocked,
  checkUSDTStatus
);

// router.post("/get-net-amount", getNetAmount);
// router.post("/process-batches", processInBatches);

module.exports = router;
