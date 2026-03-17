const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const JWT_TTL = "7d";
const JWT_COOKIE_NAME = "token";
const revokedTokens = new Map();

const getJwtSecret = () => {
  const secret = (process.env.JWT_SECRET || "").trim();
  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "JWT_SECRET is required in production. Set a strong random JWT_SECRET env var.",
    );
  }

  return "insecure_dev_jwt_secret_change_me";
};

const generateToken = (userId) => {
  const jti = crypto.randomUUID();
  return jwt.sign({ userId: userId.toString(), jti }, getJwtSecret(), {
    expiresIn: JWT_TTL,
  });
};

const verifyToken = (token) => jwt.verify(token, getJwtSecret());

const getAuthCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
});

const revokeToken = (token) => {
  try {
    const decoded = verifyToken(token);
    const expMs = decoded?.exp ? decoded.exp * 1000 : Date.now() + 60 * 1000;
    revokedTokens.set(token, expMs);
  } catch {
    // Ignore invalid tokens on revoke
  }
};

const isTokenRevoked = (token) => {
  const expMs = revokedTokens.get(token);
  if (!expMs) return false;
  if (Date.now() >= expMs) {
    revokedTokens.delete(token);
    return false;
  }
  return true;
};

const cleanupRevokedTokens = () => {
  const now = Date.now();
  for (const [token, expMs] of revokedTokens.entries()) {
    if (expMs <= now) {
      revokedTokens.delete(token);
    }
  }
};

const resetRevokedTokens = () => {
  revokedTokens.clear();
};

module.exports = {
  JWT_COOKIE_NAME,
  generateToken,
  verifyToken,
  getAuthCookieOptions,
  revokeToken,
  isTokenRevoked,
  cleanupRevokedTokens,
  resetRevokedTokens,
};
