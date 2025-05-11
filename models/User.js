const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true }, // optional
  password: { type: String, required: true },
  wallet: { type: String, required: true, unique: true },
  referralCode: { type: String, required: true, unique: true },
  referrer: { type: String, default: null },
  left: { type: String, default: null },
  right: { type: String, default: null },
  tier: { type: String, default: "Bronze" },
  hasDeposited: { type: Boolean, default: false },
  credits: { type: Number, default: 1000 },
  walletBalance: { type: Number, default: 0 },
  earnings: { type: Number, default: 0 },
  weeklyEarnings: { type: Number, default: 0 },
  lastReset: { type: Date, default: Date.now },
  directReferrals: { type: [String], default: [] },
  balance: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  lastPayoutTimestamp: { type: Date, default: null },
});

module.exports = mongoose.model("User", userSchema);
