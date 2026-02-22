/**
 * Rate Limiting Middleware
 * Protects auth endpoints from brute force and DoS attacks
 */

// Simple in-memory rate limiter (for small-scale use; use Redis for production)
class SimpleRateLimiter {
  constructor(windowMs = 15 * 60 * 1000, maxRequests = 5) {
    this.windowMs = windowMs; // Time window in milliseconds (default 15 min)
    this.maxRequests = maxRequests; // Max requests per window
    this.requests = new Map(); // Store IP -> {count, resetTime}
    // Cleanup old entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    if (typeof this.cleanupInterval.unref === "function") {
      this.cleanupInterval.unref();
    }
  }

  cleanup() {
    const now = Date.now();
    for (const [ip, data] of this.requests.entries()) {
      if (data.resetTime < now) {
        this.requests.delete(ip);
      }
    }
  }

  isLimited(ip) {
    const now = Date.now();
    const data = this.requests.get(ip);

    if (!data) {
      // First request from this IP
      this.requests.set(ip, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return false;
    }

    if (now > data.resetTime) {
      // Window has expired, reset
      this.requests.set(ip, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return false;
    }

    // Increment counter
    data.count++;

    if (data.count > this.maxRequests) {
      return true; // Limit exceeded
    }

    return false;
  }

  destroy() {
    clearInterval(this.cleanupInterval);
  }
}

// Create limiters for different endpoints
const loginLimiter = new SimpleRateLimiter(15 * 60 * 1000, 5); // 5 attempts per 15 min
const signupLimiter = new SimpleRateLimiter(60 * 60 * 1000, 3); // 3 attempts per hour
const generalLimiter = new SimpleRateLimiter(60 * 1000, 100); // 100 requests per minute

// Middleware factory
const createRateLimitMiddleware = (limiter) => {
  return (req, res, next) => {
    const ip =
      (process.env.NODE_ENV === "test" && req.headers["x-test-client-id"]) ||
      req.ip ||
      req.connection.remoteAddress;

    if (limiter.isLimited(ip)) {
      return res.status(429).json({
        msg: "Too many requests. Please try again later.",
        retryAfter: limiter.windowMs / 1000,
      });
    }

    next();
  };
};

module.exports = {
  loginLimiter: createRateLimitMiddleware(loginLimiter),
  signupLimiter: createRateLimitMiddleware(signupLimiter),
  generalLimiter: createRateLimitMiddleware(generalLimiter),
  SimpleRateLimiter, // Export class for testing
  resetAllRateLimiters: () => {
    loginLimiter.requests.clear();
    signupLimiter.requests.clear();
    generalLimiter.requests.clear();
  },
};
