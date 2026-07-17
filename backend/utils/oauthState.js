const crypto = require("crypto");

const OAUTH_STATE_COOKIE_NAME = "oauth_state";
const OAUTH_STATE_TTL_MS = 15 * 60 * 1000;

const base64Url = (buffer) =>
  Buffer.from(buffer)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const getOAuthStateSecret = () => {
  const secret = (
    process.env.OAUTH_STATE_SECRET ||
    process.env.CSRF_SECRET ||
    process.env.SESSION_SECRET ||
    process.env.JWT_SECRET ||
    ""
  ).trim();

  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "OAUTH_STATE_SECRET (or CSRF_SECRET/SESSION_SECRET/JWT_SECRET) is required in production.",
    );
  }

  return "insecure_dev_oauth_state_secret_change_me";
};

const getOAuthStateCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: OAUTH_STATE_TTL_MS,
  path: "/",
});

const signPayload = (payload) =>
  base64Url(
    crypto
      .createHmac("sha256", getOAuthStateSecret())
      .update(payload)
      .digest(),
  );

const createOAuthState = () => {
  const nonce = crypto.randomBytes(24).toString("hex");
  const issuedAt = Date.now().toString();
  const payload = `${nonce}.${issuedAt}`;
  const sig = signPayload(payload);
  return `${payload}.${sig}`;
};

const validateOAuthState = (state) => {
  try {
    if (!state || typeof state !== "string") return false;
    const parts = state.split(".");
    if (parts.length !== 3) return false;

    const [nonce, issuedAt, sig] = parts;
    if (!nonce || !issuedAt || !sig) return false;

    const issuedAtNumber = Number(issuedAt);
    if (!Number.isFinite(issuedAtNumber)) return false;
    if (Date.now() - issuedAtNumber > OAUTH_STATE_TTL_MS) return false;

    const expectedSig = signPayload(`${nonce}.${issuedAt}`);
    const a = Buffer.from(sig);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
};

module.exports = {
  OAUTH_STATE_COOKIE_NAME,
  createOAuthState,
  validateOAuthState,
  getOAuthStateCookieOptions,
};
