const express = require("express");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const { ensureAuth } = require("../middleware/authMiddleware");
const {
  signupLimiter,
  loginLimiter,
} = require("../middleware/rateLimitMiddleware");
const User = require("../models/User");
const {
  getRepos,
  getCurrentUser,
  logout,
} = require("../controllers/authController");

const router = express.Router();

const isStrongPassword = (password) => {
  if (!password || password.length < 8) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return hasUpper && hasLower && hasNumber && hasSpecial;
};

// ===== EMAIL/PASSWORD AUTHENTICATION =====

// Signup with email and password
router.post("/signup", signupLimiter, async (req, res, next) => {
  try {
    const { displayName, email, password } = req.body;

    if (!email || !password || !displayName) {
      return res.status(400).json({
        msg: "All fields are required",
      });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        msg: "Password must include uppercase, lowercase, number, special character, and be at least 8 characters long",
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
      res.status(201).json({
        _id: user._id,
        email: user.email,
        displayName: user.displayName,
        username: user.username,
      });
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({
      msg: "Failed to create account",
    });
  }
});

// Login with email and password
router.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        msg: "Email and password required",
      });
    }

    // Find user by email
    const user = await User.findOne({ email }).select("+password");
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
          _id: user._id,
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
router.get("/github", (req, res, next) => {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    return res.status(503).json({ msg: "GitHub OAuth is not configured" });
  }
  return passport.authenticate("github", { scope: ["user:email"] })(
    req,
    res,
    next,
  );
});

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
router.get("/google", (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({ msg: "Google OAuth is not configured" });
  }
  return passport.authenticate("google", { scope: ["profile", "email"] })(
    req,
    res,
    next,
  );
});

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
router.post("/logout", logout);
router.get("/logout", logout);

module.exports = router;
