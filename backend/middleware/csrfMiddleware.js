const crypto = require("crypto");
const { JWT_COOKIE_NAME } = require("../utils/jwt");

const CSRF_COOKIE_NAME = "csrf_token";

const base64Url = (buffer) =>
  Buffer.from(buffer)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const getCsrfSecret = () => {
  const secret = (
    process.env.CSRF_SECRET ||
    process.env.JWT_SECRET ||
    process.env.SESSION_SECRET ||
    ""
  ).trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "CSRF_SECRET (or JWT_SECRET/SESSION_SECRET) is required in production.",
    );
  }
  return "insecure_dev_csrf_secret_change_me";
};

const generateCSRFToken = () => {
  const nonce = crypto.randomBytes(32).toString("hex");
  const mac   = crypto.createHmac("sha256", getCsrfSecret()).update(nonce).digest();
  return `${nonce}.${base64Url(mac)}`;
};

const validateCSRFToken = (token) => {
  try {
    if (!token || typeof token !== "string") return false;
    const [nonce, sig] = token.split(".");
    if (!nonce || !sig) return false;
    const expected = base64Url(
      crypto.createHmac("sha256", getCsrfSecret()).update(nonce).digest(),
    );
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
};

// ─── Token provider — runs on every request, seeds cookie + header ────────────
const csrfTokenProvider = (req, res, next) => {
  let token = req.cookies?.[CSRF_COOKIE_NAME];
  if (!token || !validateCSRFToken(token)) {
    token = generateCSRFToken();
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false, // must be readable by JS so api.js can fall back to it
      secure:   process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });
  }
  // Always echo in response header so the SPA in-memory cache stays fresh
  res.set("X-CSRF-Token", token);
  req.csrfToken = token;
  next();
};

// ─── Protection middleware — validates token on state-changing requests ────────
const csrfProtection = (req, res, next) => {
  // Read-only methods never carry CSRF risk
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();

  // No auth cookie/bearer → let ensureAuth return 401 first
  const hasBearer     = req.headers.authorization?.startsWith("Bearer ");
  const hasAuthCookie = Boolean(req.cookies?.[JWT_COOKIE_NAME]);
  if (!hasBearer && !hasAuthCookie) return next();

  // Paths that are intentionally CSRF-exempt:
  //   • Auth endpoints that use credentials directly (login, signup, logout, OAuth)
  //   • Invite accept/decline — the student may have just completed login/signup
  //     and the in-memory CSRF token may not be primed yet on their first POST.
  //     The invite token itself provides sufficient entropy for these endpoints.
  //   • Health check
  const exemptPatterns = [
    /^\/api\/auth\//,
    /^\/api\/health$/,
    /^\/api\/workspaces\/invites\/[^/]+\/(accept|decline)$/,
  ];

  if (exemptPatterns.some((re) => re.test(req.path))) return next();

  const token = req.headers["x-csrf-token"] || req.body?._csrf || req.query?._csrf;

  if (!token) {
    return res.status(403).json({
      msg: "CSRF token missing. Refresh the page and try again.",
    });
  }

  const tokenInCookie  = req.cookies?.[CSRF_COOKIE_NAME];
  const tokenIsValid   = validateCSRFToken(token);
  const cookieIsValid  = !tokenInCookie || validateCSRFToken(tokenInCookie);

  if (!tokenIsValid || !cookieIsValid) {
    return res.status(403).json({
      msg: "CSRF token invalid or expired. Refresh the page and try again.",
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
