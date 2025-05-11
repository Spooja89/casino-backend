const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const User = require("./models/User");

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

// Middleware

const allowedOrigins = [
  "http://localhost:3000", // Local dev frontend
  "https://dumm-y-deploy-frontend.vercel.app" // Vercel frontend
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      console.log("The origin is allowed");
      callback(null, true);
    } else {
      callback(new Error("CORS policy violation: Origin not allowed"));
    }
  },
  credentials: true
}));
app.use(express.json());

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => {
  console.error("❌ MongoDB error:", err.message);
  process.exit(1);
});

// Routes
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api", require("./routes/tree"));  // Now matches /api/tree/:userId
app.use("/api/referral", require("./routes/referral"));  // referral creation, tree, payout
app.use("/api/deposit", require("./routes/deposit"));
app.use("/api/mlm", require("./routes/mlm"));



// Health check
app.get("/", (req, res) => res.send("🎰 Crypto Casino API is live"));

app.get("/api/ufindusers", async (req, res) => {
  try {
    const users = await User.find(); // Gets all users
    res.status(200).json({
      status: "success",
      data: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch users",
    });
  }
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "API is live",
  });
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
