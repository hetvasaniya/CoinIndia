/**
 * Rate Limiting Middleware for Authentication & Email endpoints
 * 
 * Uses express-rate-limit if available, with a robust fallback
 * in-memory sliding window limiter to prevent OTP spam, email spam,
 * and brute-force credential attacks.
 */

const createFallbackLimiter = ({ windowMs, max, message }) => {
  const hits = new Map();

  // Periodically clean expired records
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (now > record.resetTime) {
        hits.delete(key);
      }
    }
  }, 60000);

  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    let record = hits.get(ip);
    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      hits.set(ip, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        message: message || 'Too many requests. Please try again later.',
        retryAfter,
      });
    }

    next();
  };
};

let rateLimit;
try {
  rateLimit = require('express-rate-limit');
} catch (e) {
  rateLimit = null;
}

const buildLimiter = (options) => {
  if (rateLimit && typeof rateLimit === 'function') {
    return rateLimit({
      standardHeaders: true,
      legacyHeaders: false,
      ...options,
      handler: (req, res, next, opts) => {
        res.status(opts.statusCode || 429).json({
          message: typeof opts.message === 'string' ? opts.message : opts.message?.message || 'Too many requests. Please try again later.',
        });
      },
    });
  }
  return createFallbackLimiter(options);
};

// General auth rate limit (login, register): 30 requests per 15 minutes
const authLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
});

// OTP verification & resend rate limit: 10 requests per 15 minutes
const otpLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many verification requests. Please wait a few minutes before trying again.',
});

// Password reset requests: 5 requests per 15 minutes
const passwordResetLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many password reset requests. Please try again after 15 minutes.',
});

module.exports = {
  authLimiter,
  otpLimiter,
  passwordResetLimiter,
};
