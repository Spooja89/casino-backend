const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const User = require("../models/User");
const { handleWeeklyPayout, updateUserTier } = require("../controllers/userController");
const { handleBet } = require("../controllers/mlmController");

// ✅ Register with referral logic
router.post("/register", async (req, res) => {

  // Destructure request body
  console.log("Entered the useRoutes backend and register page");

  const { username, password, wallet, referralCode, referrerCode } = req.body;

  // Input validation
  if (!username || !password || !wallet || !referralCode) {
    return res.status(400).json({ error: "username, password, wallet, and referralCode are required" });
  }

  try {
    console.log("the name us ",username);


    // Check if the username or wallet already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ error: "Username already exists" });

    const walletExists = await User.findOne({ wallet });
    if (walletExists) return res.status(400).json({ error: "Wallet already in use" });

    const codeExists = await User.findOne({ referralCode });
    if (codeExists) return res.status(400).json({ error: "Referral code must be unique" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Prepare new user object
    const newUser = new User({
      username,
      password: hashedPassword,
      wallet,
      referralCode:referralCode,
      referrer: referrerCode || null,
      balance: 1000,
      hasDeposited: false,
      totalEarnings: 0,
      tier: "Bronze",
      directReferrals: [],
    });

    let position = null;
    let currentReferrals = {};

    // Handle referral logic
    if (referrerCode) {
      const referrerUser = await User.findOne({ referralCode: referrerCode });
      if (!referrerUser) return res.status(400).json({ error: "Referrer not found" });

      // Assign user to the left or right position in the referrer’s binary tree
      if (!referrerUser.left) {
        referrerUser.left = username;
        position = "left";
      } else if (!referrerUser.right) {
        referrerUser.right = username;
        position = "right";
      } else {
        return res.status(400).json({ error: "Referrer already has two referrals" });
      }

      // Update referrer’s direct referrals list and save
      referrerUser.directReferrals.push(username);
      await referrerUser.save();

      // Set current referrals (left and right)
      currentReferrals = {
        left: referrerUser.left || null,
        right: referrerUser.right || null,
      };
    }

    // Save the new user to the database
    await newUser.save();

    // Generate the referral link for the new user
    const referralLink = `${req.protocol}://${req.get("host")}/?ref=${newUser.referralCode}`;

    // Send the response with user details, position, and current referrals
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      username: newUser.username,
      referralLink,
      position,
      ...(referrerCode ? { currentReferrals } : {}),
    });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
});

// Deposit funds
router.post("/deposit", async (req, res) => {
  const { userId, amount } = req.body;

  if (!userId || !amount || amount <= 0) {
    return res.status(400).json({ error: "Invalid userId or amount" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.balance += amount;
    user.hasDeposited = true;
    await user.save();

    return res.status(200).json({ success: true, message: "Deposit successful", user });
  } catch (err) {
    console.error("Deposit error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Weekly payout
router.post("/payout", async (req, res) => {
  const { userId, amount } = req.body;

  if (!userId || !amount || amount <= 0) {
    return res.status(400).json({ error: "Invalid userId or amount" });
  }

  try {
    const user = await handleWeeklyPayout(userId, amount);
    await updateUserTier(user);

    return res.status(200).json({ success: true, message: "Payout successful", user });
  } catch (err) {
    console.error("Payout error:", err);
    return res.status(400).json({ error: err.message });
  }
});

// Bet
router.post("/bet", handleBet);

// Get all users (for testing purposes)
router.get("/all", async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Server error" });
  }
});


module.exports = router;
