const User = require("../models/User");

// 🔁 Recursive function to build the referral tree
const buildReferralTree = async (user) => {
  const referrals = await User.find({ referrer: user.referralCode });
  const children = await Promise.all(
    referrals.map(async (referral) => buildReferralTree(referral))
  );

  return {
    userId: user._id,
    username: user.username,
    referrals: children,
  };
};

// 🌲 GET /api/tree/:userId
const getReferralTree = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const referralTree = await buildReferralTree(user);
    res.json(referralTree);
  } catch (err) {
    res.status(500).json({ message: "Error fetching referral tree", error: err.message });
  }
};

// 💰 Calculate MLM reward for referrer
const calculateMLMReward = async (user, rewardAmount) => {
  if (!user.referrer) return;

  const referrer = await User.findOne({ referralCode: user.referrer });
  if (!referrer) return;

  // Ensure MLM applies only for users who deposited
  if (!user.hasDeposited) return;

  referrer.totalEarnings += rewardAmount;
  referrer.balance += rewardAmount;
  await referrer.save();
};

// 🃏 POST /api/users/bet
const handleBet = async (req, res) => {
  const { username, amount, result } = req.body;

  if (!username || !amount || amount <= 0 || !["win", "loss"].includes(result)) {
    return res.status(400).json({ error: "Invalid request data" });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.balance < amount && result === "loss") {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Apply win/loss logic
    if (result === "win") {
      user.balance += amount;
    } else {
      user.balance -= amount;
    }

    await user.save();

    // Apply 10% MLM reward if conditions met
    const mlmReward = amount * 0.1;
    await calculateMLMReward(user, mlmReward);

    return res.status(200).json({
      success: true,
      message: "Bet processed successfully",
      result,
      newBalance: user.balance,
    });
  } catch (error) {
    console.error("Bet error:", error);
    return res.status(500).json({ error: error.message || "Server error" });
  }
};

module.exports = {
  getReferralTree,
  handleBet,
};
