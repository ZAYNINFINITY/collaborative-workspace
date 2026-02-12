const axios = require("axios");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const clientUrl = (process.env.CLIENT_URL || "http://localhost:3000").replace(
  /\/+$/,
  "",
);

exports.githubCallback = (req, res) => {
  // Successful authentication, redirect to frontend dashboard
  res.redirect(`${clientUrl}/dashboard`);
};

exports.getCurrentUser = (req, res) => {
  if (req.user) {
    return res.json(req.user);
  }

  return res.status(401).json({ msg: "Not authenticated" });
};

exports.getRepos = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ msg: "Not authenticated" });
  }

  try {
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
    return next(err);
  }
};

exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }

    // Destroy session and clear cookie
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.redirect(clientUrl);
    });
  });
};
