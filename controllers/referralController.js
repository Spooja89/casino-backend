// backend/controllers/referralController.js

const User = require('../models/User');

// Simulated commission distribution logic
exports.distributeCommission = async (userWallet, commissionAmount) => {
  try {
    const user = await User.findOne({ wallet: userWallet });

    if (!user) {
      console.log("User not found for commission:", userWallet);
      return;
    }

    let payout = commissionAmount;

    if (user.weeklyEarnings + payout > 50000) {
      payout = Math.max(0, 50000 - user.weeklyEarnings); // Enforce weekly cap
    }

    user.weeklyEarnings += payout;

    // If you're storing MLM commission history, log here
    // e.g., user.commissions.push({ amount: payout, date: new Date() });

    await user.
    save();

    console.log(`✅ Paid $${payout} to ${userWallet}`);
  } catch (err) {
    console.error("❌ Error distributing commission:", err);
  }
};
