// Require express and the User model
const express = require("express");

const {
  getUser,
  getAllUsers,
  updateUserBalance,
  createAdmin,
  getUserTransactions,
  getAllUserTransactions,
} = require("../controllers/users");
const { protect, authorize } = require("../middlewares/auth");

const router = express.Router();

router.get("/:id", protect, getUser);
router.get("/", protect, authorize("admin"), getAllUsers);
router.put("/update-balance", protect, authorize("admin"), updateUserBalance);
router.post("/create-admin", createAdmin);

router.get("/:id/transactions", protect, getUserTransactions);

router.get('/transactions', protect, authorize('admin'), getAllUserTransactions)

module.exports = router;
