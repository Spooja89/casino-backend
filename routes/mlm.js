const express = require("express");
const router = express.Router();
const { handleBet, getReferralTree } = require("../controllers/mlmController");

// POST /api/mlm/bet
router.post("/bet", handleBet);

// GET /api/mlm/tree/:userId
router.get("/tree/:userId", getReferralTree); // ✅


module.exports = router;
