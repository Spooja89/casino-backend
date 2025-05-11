const User = require('../models/User');
const express = require("express");
const router = express.Router();

// Updated recursive function
async function getTree(wallet, visited = new Set()) {
  if (visited.has(wallet)) return null;
  visited.add(wallet);

  const node = await User.findOne({ wallet });
  if (!node) return null;

  return {
    wallet: node.wallet,
    left: node.left ? await getTree(node.left, visited) : null,
    right: node.right ? await getTree(node.right, visited) : null,
  };
}

// Updated route
router.get("/tree/:wallet", async (req, res) => {
  const wallet = req.params.wallet?.trim();
  if (!wallet || wallet.length < 3) {
    return res.status(400).json({ error: "Invalid or missing wallet" });
  }

  try {
    const tree = await getTree(wallet);
    if (!tree) return res.status(404).json({ error: "Referral tree not found" });
    res.json(tree);
  } catch (err) {
    console.error("Tree Fetch Error:", err);
    res.status(500).json({ error: "Server error while fetching tree" });
  }
});

module.exports = router;
