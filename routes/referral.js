const express = require('express');
const authMiddleware = require('../middleware/authMiddleware'); // Middleware for JWT auth
const Referral = require('../models/referral'); // Referral model
const User = require('../models/User'); // User model
const router = express.Router();
const referralController = require('../controllers/referralController');

// GET /api/referral/tree?wallet=...
// Public route to fetch left and right referrals of a user
router.get('/tree', async (req, res) => {
  const { wallet } = req.query;

  if (!wallet) {
    return res.status(400).json({ message: 'Wallet address is required' });
  }

  try {
    const user = await User.findOne({ wallet });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const left = user.left ? await User.findOne({ wallet: user.left }) : null;
    const right = user.right ? await User.findOne({ wallet: user.right }) : null;

    res.json({ user, left, right });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch tree', error: err.message });
  }
});

// POST /api/referral/new
// Protected route to create a referral under the authenticated user
router.post('/new', authMiddleware, async (req, res) => {
  const { newUserWallet } = req.body;
  const referrerId = req.user.userId; // Decoded from JWT token

  if (!newUserWallet) {
    return res.status(400).json({ message: 'New user wallet is required' });
  }

  try {
    const referrerUser = await User.findById(referrerId);
    if (!referrerUser) {
      return res.status(404).json({ message: 'Referrer not found' });
    }

    const newUser = await User.findOne({ wallet: newUserWallet });
    if (!newUser) {
      return res.status(404).json({ message: 'New user not found' });
    }

    // Place new user on left or right side
    if (!referrerUser.left) {
      referrerUser.left = newUserWallet;
    } else if (!referrerUser.right) {
      referrerUser.right = newUserWallet;
    } else {
      return res.status(400).json({ message: 'Referrer already has two referrals' });
    }

    await referrerUser.save();

    newUser.referrer = referrerUser.wallet; // Set the referrer wallet address
    await newUser.save();

    // Save the referral
    const newReferral = new Referral({
      newUserWallet,
      referrer: referrerUser.wallet
    });

    await newReferral.save();

    res.status(201).json({
      message: 'Referral successfully created',
      referral: newReferral
    });

  } catch (err) {
    res.status(500).json({ message: 'Error creating referral', error: err.message });
  }
});

router.post('/payout', async (req, res) => {
    const { wallet, amount } = req.body;
  
    try {
      await referralController.distributeCommission(wallet, amount);
      res.json({ message: "Commission distributed (with cap enforced)." });
    } catch (err) {
      res.status(500).json({ error: "Error processing commission." });
    }
  });
  
module.exports = router;
