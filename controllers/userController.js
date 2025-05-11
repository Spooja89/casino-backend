const User = require("../models/User");
const bcrypt = require("bcryptjs");

// ✅ Update Tier Based on Balance
const updateUserTier = async (user) => {
  if (user.balance >= 500) {
    user.tier = "Gold";
  } else if (user.balance >= 100) {
    user.tier = "Silver";
  } else {
    user.tier = "Bronze";
  }
  await user.save();
};

// ✅ Weekly Payout Handler with cap and tier update
const handleWeeklyPayout = async (userId, amount) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const now = new Date();
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(now.getDate() - 7);

  if (!user.lastPayoutTimestamp || user.lastPayoutTimestamp < oneWeekAgo) {
    user.totalEarnings = 0;
    user.lastPayoutTimestamp = now;
  }

  if (user.totalEarnings + amount > 50000) {
    throw new Error("Weekly payout cap exceeded. Max is $50,000.");
  }

  if (user.balance < amount) {
    throw new Error("Insufficient balance.");
  }

  user.totalEarnings += amount;
  user.balance -= amount;
  await updateUserTier(user);

  return user;
};

module.exports = {
  updateUserTier,
  handleWeeklyPayout,
};
