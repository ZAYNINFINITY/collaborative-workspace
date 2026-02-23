const User = require("../models/User");
const {
  JWT_COOKIE_NAME,
  verifyToken,
  isTokenRevoked,
} = require("../utils/jwt");

exports.ensureAuth = async (req, res, next) => {
  try {
    const bearerToken = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice("Bearer ".length)
      : null;
    const token = req.cookies?.[JWT_COOKIE_NAME] || bearerToken;

    if (!token || isTokenRevoked(token)) {
      return res.status(401).json({ msg: "Not authenticated" });
    }

    const payload = verifyToken(token);
    const user = await User.findById(payload.userId).select(
      "+accessToken +refreshToken",
    );

    if (!user) {
      return res.status(401).json({ msg: "Not authenticated" });
    }

    req.user = user;
    req.userId = user._id;
    req.authToken = token;
    return next();
  } catch {
    return res.status(401).json({ msg: "Not authenticated" });
  }
};

