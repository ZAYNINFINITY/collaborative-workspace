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

const CSRF_COOKIE_NAME = "csrf_token";

const base64Url = (buffer) =>
  Buffer.from(buffer)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const getCsrfSecret = () => {
  const secret =
    (process.env.CSRF_SECRET || process.env.JWT_SECRET || process.env.SESSION_SECRET || "").trim();
  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "CSRF_SECRET (or JWT_SECRET/SESSION_SECRET) is required in production for CSRF protection.",
    );
  }

  return "insecure_dev_csrf_secret_change_me";
};

// Generate a CSRF token
const generateCSRFToken = () => {
  const nonce = crypto.randomBytes(32).toString("hex");
  const mac = crypto
    .createHmac("sha256", getCsrfSecret())
    .update(nonce)
    .digest();
  const sig = base64Url(mac);
  return `${nonce}.${sig}`;
};

// Validate CSRF token
const validateCSRFToken = (token) => {
  try {
    if (!token || typeof token !== "string") return false;
    const parts = token.split(".");
    if (parts.length !== 2) return false;

    const [nonce, sig] = parts;
    if (!nonce || !sig) return false;

    const expectedMac = crypto
      .createHmac("sha256", getCsrfSecret())
      .update(nonce)
      .digest();
    const expectedSig = base64Url(expectedMac);

    const a = Buffer.from(sig);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
};

// Middleware to generate and provide CSRF token
const csrfTokenProvider = (req, res, next) => {
  let token = req.cookies?.[CSRF_COOKIE_NAME];
  if (!token || !validateCSRFToken(token)) {
    token = generateCSRFToken();
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
    "/api/auth/logout",
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
  const tokenIsValid = validateCSRFToken(token);
  const tokenMatchesCookie = tokenInCookie && tokenInCookie === token;

  if (
    process.env.NODE_ENV !== "test" &&
    (!tokenIsValid || !tokenMatchesCookie)
  ) {
    return res.status(403).json({
      msg: "CSRF token invalid or expired",
      hint: "Try refreshing the page and retrying",
    });
  }

  next();
};

module.exports = {
  csrfTokenProvider,
  csrfProtection,
  generateCSRFToken,
  validateCSRFToken,
  CSRF_COOKIE_NAME,
};
