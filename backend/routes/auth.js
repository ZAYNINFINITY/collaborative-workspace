const express = require("express");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const { ensureAuth } = require("../middleware/authMiddleware");
const {
  signupLimiter,
  loginLimiter,
} = require("../middleware/rateLimitMiddleware");
const User = require("../models/User");
const Workspace = require("../models/Workspace");
const {
  getRepos,
  getCurrentUser,
  logout,
} = require("../controllers/authController");
const {
  generateToken,
  JWT_COOKIE_NAME,
  getAuthCookieOptions,
} = require("../utils/jwt");
const {
  OAUTH_STATE_COOKIE_NAME,
  createOAuthState,
  validateOAuthState,
  getOAuthStateCookieOptions,
} = require("../utils/oauthState");

const router = express.Router();
const clientUrl = (process.env.CLIENT_URL || "http://localhost:3000").replace(
  /\/+$/,
  "",
);
const githubFailureRedirect = `${clientUrl}/login?error=github_auth_failed`;
const googleFailureRedirect = `${clientUrl}/login?error=google_auth_failed`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generate a unique username from a base string.
 * If the base is already taken, append a short random suffix and retry.
 */
const generateUniqueUsername = async (base) => {
  // Sanitize: lowercase, strip non-alphanumeric except underscore
  const sanitized = base.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20) || "user";
  let username = sanitized;
  let attempts = 0;
  while (attempts < 10) {
    const existing = await User.findOne({ username });
    if (!existing) return username;
    const suffix = Math.random().toString(36).slice(2, 6); // 4 random chars
    username = `${sanitized}_${suffix}`;
    attempts++;
  }
  // Last-resort: full random
  return `user_${Math.random().toString(36).slice(2, 10)}`;
};

const isStrongPassword = (password) => {
  if (!password || password.length < 8) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return hasUpper && hasLower && hasNumber && hasSpecial;
};

// ---------------------------------------------------------------------------
// OAuth helpers
// ---------------------------------------------------------------------------

const beginOAuth = (provider, scope) => (req, res, next) => {
  const state = createOAuthState();
  res.cookie(
    `${OAUTH_STATE_COOKIE_NAME}_${provider}`,
    state,
    getOAuthStateCookieOptions(),
  );
  return passport.authenticate(provider, {
    scope,
    session: false,
    state,
  })(req, res, next);
};

/**
 * Determine where to send the user after OAuth.
 * New users (no workspaces yet) → /onboarding so they get guided setup.
 * Returning users → /dashboard.
 */
const getPostOAuthRedirect = async (userId) => {
  try {
    const count = await Workspace.countDocuments({
      $or: [{ owner: userId }, { "members.user": userId }],
    });
    return count === 0 ? `${clientUrl}/onboarding` : `${clientUrl}/dashboard`;
  } catch {
    return `${clientUrl}/dashboard`;
  }
};

const completeOAuth =
  (provider, failureRedirect) =>
  (req, res, next) => {
    const stateCookieName = `${OAUTH_STATE_COOKIE_NAME}_${provider}`;
    const expectedState = req.cookies?.[stateCookieName];
    const receivedState = req.query?.state;

    res.clearCookie(stateCookieName, getOAuthStateCookieOptions());

    if (
      !expectedState ||
      !receivedState ||
      expectedState !== receivedState ||
      !validateOAuthState(receivedState)
    ) {
      return res.redirect(failureRedirect);
    }

    return passport.authenticate(
      provider,
      {
        session: false,
        state: false,
        failureRedirect,
      },
      async (err, user) => {
        if (err || !user) {
          return res.redirect(failureRedirect);
        }
        const token = generateToken(user._id);
        res.cookie(JWT_COOKIE_NAME, token, getAuthCookieOptions());
        const redirectTo = await getPostOAuthRedirect(user._id);
        return res.redirect(redirectTo);
      },
    )(req, res, next);
  };

// ---------------------------------------------------------------------------
// Email / password auth
// ---------------------------------------------------------------------------

router.post("/signup", signupLimiter, async (req, res) => {
  try {
    const { displayName, email, password } = req.body;

    if (!email || !password || !displayName) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        msg: "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character.",
      });
    }

    // Check if email already in use
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ msg: "An account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Auto-resolve username collisions — students never see a collision error
    const baseUsername = email.split("@")[0];
    const username = await generateUniqueUsername(baseUsername);

    const user = new User({
      displayName,
      email,
      password: hashedPassword,
      username,
    });

    await user.save();

    const token = generateToken(user._id);
    res.cookie(JWT_COOKIE_NAME, token, getAuthCookieOptions());

    return res.status(201).json({
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
      username: user.username,
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ msg: "Failed to create account. Please try again." });
  }
});

router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: "Email and password are required." });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !user.password) {
      return res.status(401).json({ msg: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ msg: "Invalid email or password." });
    }

    const token = generateToken(user._id);
    res.cookie(JWT_COOKIE_NAME, token, getAuthCookieOptions());

    return res.json({
      msg: "Logged in successfully",
      user: {
        _id: user._id,
        email: user.email,
        displayName: user.displayName,
        username: user.username,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ msg: "Login failed. Please try again." });
  }
});

// ---------------------------------------------------------------------------
// OAuth routes
// ---------------------------------------------------------------------------

router.get("/github", (req, res, next) => {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    return res.status(503).json({ msg: "GitHub OAuth is not configured" });
  }
  return beginOAuth("github", ["user:email"])(req, res, next);
});

router.get("/github/callback", completeOAuth("github", githubFailureRedirect));

router.get("/repos", ensureAuth, getRepos);

router.get("/google", (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({ msg: "Google OAuth is not configured" });
  }
  return beginOAuth("google", ["profile", "email"])(req, res, next);
});

router.get("/google/callback", completeOAuth("google", googleFailureRedirect));

// ---------------------------------------------------------------------------
// Current user & logout
// ---------------------------------------------------------------------------

router.get("/user", ensureAuth, getCurrentUser);
router.post("/logout", logout);
router.get("/logout", logout);

module.exports = router;
