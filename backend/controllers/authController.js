const axios = require("axios");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const {
  JWT_COOKIE_NAME,
  getAuthCookieOptions,
  revokeToken,
} = require("../utils/jwt");
const { CSRF_COOKIE_NAME } = require("../middleware/csrfMiddleware");

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
    const token = req.cookies?.[JWT_COOKIE_NAME];
    if (token) {
      revokeToken(token);
    }

    // Prevent caches/proxies from serving a stale authenticated response.
    res.set("Cache-Control", "no-store");

    const cookieOptions = getAuthCookieOptions();
    const baseClearOptions = {
      path: cookieOptions?.path || "/",
      domain: cookieOptions?.domain,
    };

    // Best-effort cookie cleanup. Some browsers can be picky if attributes ever
    // changed across deployments, so we expire multiple common variants.
    res.clearCookie(JWT_COOKIE_NAME, baseClearOptions);
    res.cookie(JWT_COOKIE_NAME, "", {
      ...cookieOptions,
      maxAge: 0,
      expires: new Date(0),
    });
    res.cookie(JWT_COOKIE_NAME, "", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 0,
      expires: new Date(0),
      path: baseClearOptions.path,
    });

    // Some older deployments used session cookies. Clearing it is harmless and
    // prevents "still logged in" UI confusion if a `connect.sid` cookie exists.
    res.clearCookie("connect.sid", { path: "/" });
    // Clear CSRF cookie using the same attributes used when setting it (secure/sameSite)
    // otherwise some browsers will keep the cookie after logout.
    res.clearCookie(CSRF_COOKIE_NAME, {
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    const wantsHtml =
      req.headers.accept && req.headers.accept.includes("text/html");
    const redirectTo = `${clientUrl}/login?logged_out=true`;
    if (wantsHtml) {
      return res.redirect(302, redirectTo);
    }

    return res.json({ msg: "Logged out successfully" });
  } catch (err) {
    console.error("Logout exception:", err);
    return res.status(500).json({ msg: "Logout failed" });
  }
};
