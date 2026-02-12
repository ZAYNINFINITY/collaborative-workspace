const express = require("express");
const passport = require("passport");
const { ensureAuth } = require("../middleware/authMiddleware");
const { getRepos } = require("../controllers/authController");

const router = express.Router();

// GitHub OAuth routes
router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] }),
);

router.get(
  "/github/callback",
  passport.authenticate("github", { failureRedirect: "/" }),
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
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect(
      `${process.env.CLIENT_URL || "http://localhost:3000"}/dashboard`,
    );
  },
);

// Get current user
router.get("/user", (req, res) => {
  if (req.user) {
    res.json({
      _id: req.user._id,
      username: req.user.username,
      displayName: req.user.displayName,
      avatar: req.user.avatar,
      githubUrl: req.user.githubUrl,
      email: req.user.email,
    });
  } else {
    res.status(401).json({ msg: "Not authenticated" });
  }
});

// Logout
router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ msg: "Logout failed" });
    }
    res.redirect(process.env.CLIENT_URL || "http://localhost:3000");
  });
});

module.exports = router;
