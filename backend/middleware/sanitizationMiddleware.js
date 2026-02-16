/**
 * Middleware to sanitize all string inputs to prevent XSS attacks
 * Removes potentially harmful HTML/JavaScript content while preserving safe formatting
 */
const sanitizeInputs = (req, res, next) => {
  const sanitize = (value) => {
    if (typeof value === "string") {
      // Remove any potential XSS payloads and dangerous characters
      return (
        value
          // Remove script tags and dangerous protocols
          .replace(/<script[^>]*>.*?<\/script>/gi, "")
          .replace(/on\w+\s*=\s*[\"'][^\"']*[\"']/gi, "")
          .replace(/javascript:/gi, "")
          .replace(/vbscript:/gi, "")
          // Remove HTML tags
          .replace(/<[^>]*>/g, "")
          // Trim whitespace
          .trim()
      );
    } else if (typeof value === "object" && value !== null) {
      // Recursively sanitize object values
      if (Array.isArray(value)) {
        return value.map((item) => sanitize(item));
      }
      const sanitized = {};
      for (const [key, val] of Object.entries(value)) {
        // Sanitize keys too to prevent prototype pollution
        const cleanKey = key.replace(/[<>\"'`]/g, "").substring(0, 100);
        sanitized[cleanKey] = sanitize(val);
      }
      return sanitized;
    }
    return value;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitize(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitize(req.query);
  }

  // Sanitize URL parameters
  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
};

module.exports = sanitizeInputs;
