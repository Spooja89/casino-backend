const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST /api/deposit
router.post('/deposit', async (req, res) => {
  const { userId, amount } = req.body;

  if (!userId || !amount) {
    return res.status(400).json({ error: "userId and amount are required" });
  }

  try {
    const user = await User.findById(userId); // FIXED

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.walletBalance += amount;
    user.hasDeposited = true;
    await user.save();

    return res.status(200).json({ message: "Deposit successful", user });
  } catch (err) {
    console.error("Error in deposit:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
