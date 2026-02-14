const express = require("express");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const { ensureAuth } = require("../middleware/authMiddleware");
const User = require("../models/User");
const {
  getRepos,
  getCurrentUser,
  logout,
} = require("../controllers/authController");

const router = express.Router();

// ===== EMAIL/PASSWORD AUTHENTICATION =====

// Signup with email and password
router.post("/signup", async (req, res, next) => {
  try {
    const { displayName, email, password } = req.body;

    if (!email || !password || !displayName) {
      return res.status(400).json({
        msg: "All fields are required",
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        msg: "User already exists with this email",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    user = new User({
      displayName,
      email,
      password: hashedPassword,
      username: email.split("@")[0],
    });

    await user.save();

    req.login(user, (err) => {
      if (err) return next(err);
      res.json({
        msg: "Account created and logged in",
        user: {
          id: user._id,
          email: user.email,
          displayName: user.displayName,
          username: user.username,
        },
      });
    });
  } catch (err) {
    console.error("❌ Signup error:", {
      message: err.message,
      code: err.code,
      name: err.name,
      stack: err.stack.split('\n').slice(0, 3).join('\n')
    });
    res.status(500).json({
      msg: "Failed to create account",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Login with email and password
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        msg: "Email and password required",
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return res.status(401).json({
        msg: "Invalid email or password",
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        msg: "Invalid email or password",
      });
    }

    // Login user
    req.login(user, (err) => {
      if (err) return next(err);
      res.json({
        msg: "Logged in successfully",
        user: {
          id: user._id,
          email: user.email,
          displayName: user.displayName,
          username: user.username,
        },
      });
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      msg: "Login failed",
    });
  }
});

// ===== GITHUB & GOOGLE OAUTH =====
router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] }),
);

router.get(
  "/github/callback",
  passport.authenticate("github", {
    failureRedirect: `${process.env.CLIENT_URL || "http://localhost:3000"}/?error=github_auth_failed`,
    failureMessage: true,
  }),
  (req, res) => {
    res.redirect(
      `${process.env.CLIENT_URL || "http://localhost:3000"}/dashboard`,
    );
  },
);

// GitHub repositories for authenticated user
router.get("/repos", ensureAuth, getRepos);

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CLIENT_URL || "http://localhost:3000"}/?error=google_auth_failed`,
    failureMessage: true,
  }),
  (req, res) => {
    res.redirect(
      `${process.env.CLIENT_URL || "http://localhost:3000"}/dashboard`,
    );
  },
);

// Get current user
router.get("/user", getCurrentUser);

// Logout
router.get("/logout", logout);

module.exports = router;
