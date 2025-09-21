const User = require("../models/User");
const moment = require("moment");

exports.enforceTransferLimits = async (userId, transferAmount) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const now = new Date();

  // ===== RESET DAILY LIMIT (if needed) =====
  if (
    !user.lastDailyReset ||
    moment(now).diff(moment(user.lastDailyReset), "hours") >= 24
  ) {
    user.dailyTransferAmount = 0;
    user.lastDailyReset = now;
  }

  // ===== RESET MONTHLY LIMIT (if needed) =====
  if (
    !user.lastMonthlyReset ||
    moment(now).diff(moment(user.lastMonthlyReset), "days") >= 30
  ) {
    user.monthlyTransferAmount = 0;
    user.lastMonthlyReset = now;
  }

  // ===== INDIVIDUAL TIER (example — no limits applied here unless you want to set them) =====
  if (user.tier === "individual") {
    // No specific limit rules for now
  }

  // ===== BUSINESS TIER =====
  if (user.tier === "business") {
    // Defaults
    if (!user.dailyTransferLimit) user.dailyTransferLimit = 50000;
    if (!user.monthlyTransferLimit) user.monthlyTransferLimit = 250000;

    // 5-hour gap rule
    if (
      user.lastTransferTime &&
      moment(now).diff(moment(user.lastTransferTime), "hours") < 5
    ) {
      throw new Error(`You must wait 5 hours between transfers`);
    }

    // Per-transfer rule
    if (transferAmount > 10000) {
      throw new Error(`Maximum per transfer for Business tier is 10,000`);
    }

    // Daily limit check
    if (user.dailyTransferAmount + transferAmount > user.dailyTransferLimit) {
      throw new Error(
        `Daily transfer limit of ${user.dailyTransferLimit} exceeded`
      );
    }

    // Monthly limit check
    if (
      user.monthlyTransferAmount + transferAmount >
      user.monthlyTransferLimit
    ) {
      throw new Error(
        `Monthly transfer limit of ${user.monthlyTransferLimit} exceeded`
      );
    }
  }

  // ===== MERCHANT TIER =====
  if (user.tier === "merchant") {
    // Defaults
    if (user.monthlyTransferLimit) user.monthlyTransferLimit = 500000;

    // Per-transfer rule
    if (transferAmount > 10000) {
      throw new Error(`Maximum per transfer for Merchant tier is 10,000`);
    }

    // Monthly limit check
    if (
      user.monthlyTransferAmount + transferAmount >
      user.monthlyTransferLimit
    ) {
      throw new Error(
        `Monthly transfer limit of ${user.monthlyTransferLimit} exceeded`
      );
    }
  }

  // ===== UPDATE TRACKING =====
  user.dailyTransferAmount += transferAmount; // For merchant, daily can exceed but we still track
  user.monthlyTransferAmount += transferAmount;
  user.lastTransferTime = now;

  await user.save();
  return user;
};
