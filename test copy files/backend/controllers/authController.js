const axios = require("axios");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const clientUrl = (process.env.CLIENT_URL || "http://localhost:3000").replace(
  /\/+$/,
  "",
);

exports.getCurrentUser = (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ msg: "Not authenticated" });
    }

    // Return safe user data (exclude sensitive fields)
    return res.json({
      _id: req.user._id,
      username: req.user.username,
      displayName: req.user.displayName,
      avatar: req.user.avatar,
      profileUrl: req.user.profileUrl,
      githubUrl: req.user.githubUrl,
      email: req.user.email,
      createdAt: req.user.createdAt,
    });
  } catch (err) {
    console.error("Error getting current user:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

exports.getRepos = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ msg: "Not authenticated" });
  }

  try {
    // Check if user has GitHub access token
    if (!req.user.accessToken) {
      return res.status(400).json({ msg: "GitHub access token not available" });
    }

    const response = await axios.get("https://api.github.com/user/repos", {
      headers: {
        Authorization: `token ${req.user.accessToken}`,
        "User-Agent": "Collaborative-Workspace-App",
      },
      params: {
        sort: "updated",
        per_page: 100,
      },
    });
    return res.json(response.data);
  } catch (err) {
    console.error("Error fetching repositories from GitHub:", err.message);
    if (err.response?.status === 401) {
      return res.status(401).json({ msg: "GitHub token expired or invalid" });
    }
    return next(err);
  }
};

exports.logout = (req, res, next) => {
  try {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ msg: "Logout failed" });
      }

      // Destroy session and clear cookie
      req.session.destroy((sessionErr) => {
        if (sessionErr) {
          console.error("Session destroy error:", sessionErr);
        }
        res.clearCookie("connect.sid");
        // If the client expects HTML (browser), redirect to client URL
        const wantsHtml =
          req.headers.accept && req.headers.accept.includes("text/html");
        const redirectTo = `${clientUrl}/?logged_out=true`;
        if (wantsHtml) {
          return res.redirect(302, redirectTo);
        }

        // Otherwise return JSON for API clients
        return res.json({ msg: "Logged out successfully" });
      });
    });
  } catch (err) {
    console.error("Logout exception:", err);
    return res.status(500).json({ msg: "Logout failed" });
  }
};
