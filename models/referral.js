// models/referral.js ✅ (correct version)

const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema({
  newUserWallet: {
    type: String,
    required: true,
  },
  referrer: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Referral", referralSchema);
