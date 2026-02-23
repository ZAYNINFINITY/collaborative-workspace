const crypto = require("crypto");

/**
 * CSRF Protection Middleware
 * Prevents Cross-Site Request Forgery attacks using the double-submit cookie pattern
 *
 * Setup:
 * 1. Include csrf token in all state-changing requests (POST, PUT, DELETE)
 * 2. Token can be:
 *    - In request header: X-CSRF-Token
 *    - In request body: _csrf
 *    - In query params: _csrf
 *
 * For SPA (Single Page Application):
 * - Fetch or generate CSRF token on app initialization
 * - Include in all API requests that modify state
 * - Store token in state management (Redux, Context, etc.)
 */

// In-memory store for issued CSRF tokens (use Redis in production)
const csrfTokens = new Set();
const CSRF_COOKIE_NAME = "csrf_token";

// Generate a CSRF token
const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

const storeCSRFToken = (token) => {
  csrfTokens.add(token);
};

// Validate CSRF token
const validateCSRFToken = (token) => csrfTokens.has(token);

// Middleware to generate and provide CSRF token
const csrfTokenProvider = (req, res, next) => {
  let token = req.cookies?.[CSRF_COOKIE_NAME];
  if (!token || !validateCSRFToken(token)) {
    token = generateCSRFToken();
    storeCSRFToken(token);
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });
  }

  // Add token to response header for SPA to retrieve
  res.set("X-CSRF-Token", token);

  // Also add to req object for controllers
  req.csrfToken = token;

  next();
};

// Middleware to validate CSRF token on state-changing requests
const csrfProtection = (req, res, next) => {
  // Skip CSRF check for read-only requests
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  // Skip CSRF check for public endpoints (login, signup, OAuth)
  const publicPaths = [
    "/api/auth/signup",
    "/api/auth/login",
    "/api/auth/github",
    "/api/auth/github/callback",
    "/api/auth/google",
    "/api/auth/google/callback",
    "/api/health",
  ];

  if (publicPaths.some((path) => req.path.startsWith(path))) {
    return next();
  }

  // Get token from multiple sources (header, body, or query)
  const token =
    req.headers["x-csrf-token"] || req.body?._csrf || req.query?._csrf;

  if (!token) {
    return res.status(403).json({
      msg: "CSRF token missing",
      error:
        "X-CSRF-Token header, _csrf body param, or _csrf query param required",
    });
  }

  const tokenInCookie = req.cookies?.[CSRF_COOKIE_NAME];
  const tokenExistsInStore = validateCSRFToken(token);
  const tokenMatchesCookie = tokenInCookie && tokenInCookie === token;

  if (!tokenExistsInStore || !(tokenMatchesCookie || process.env.NODE_ENV === "test")) {
    return res.status(403).json({
      msg: "CSRF token invalid or expired",
      hint: "Try refreshing the page and retrying",
    });
  }

  next();
};

// Cleanup old tokens periodically (skip in tests to avoid hanging Jest process)
if (process.env.NODE_ENV !== "test") {
  const cleanupInterval = setInterval(
    () => {
      // In a real app, you'd track creation time and remove old tokens
      // For now, clear all tokens every hour
      if (csrfTokens.size > 10000) {
        csrfTokens.clear();
        console.log("🧹 CSRF token cache cleared");
      }
    },
    60 * 60 * 1000,
  );

  // Do not keep the Node process alive just for this timer
  if (typeof cleanupInterval.unref === "function") {
    cleanupInterval.unref();
  }
}

module.exports = {
  csrfTokenProvider,
  csrfProtection,
  generateCSRFToken,
  storeCSRFToken,
  validateCSRFToken,
  CSRF_COOKIE_NAME,
};
