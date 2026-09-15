const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

/**
 * Rate limits. Without these, /api/auth/login accepts as many password guesses
 * as an attacker's connection can carry.
 *
 * Behind a proxy these count per real client IP only because app.js sets
 * `trust proxy`. Get that wrong and every request looks like it came from the
 * proxy, which locks out all users at once.
 */
const base = {
  standardHeaders: true,
  legacyHeaders: false,
  // Tests would otherwise trip the limiter and fail for the wrong reason.
  skip: () => process.env.DISABLE_RATE_LIMITS === 'true',
};

const message = (text) => ({ status: 'error', message: text });

/** Per IP, and separately per email, so rotating IPs still hits a wall. */
const loginLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: message('Too many login attempts. Try again in a few minutes.'),
});

const loginByEmailLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 5,
  keyGenerator: (req, res) =>
    String(req.body?.email || '').trim().toLowerCase() || ipKeyGenerator(req, res),
  message: message('Too many attempts for that account. Try again in a few minutes.'),
});

const registerLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: message('Too many accounts created from here. Try again later.'),
});

const forgotPasswordLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  limit: 3,
  keyGenerator: (req, res) =>
    String(req.body?.email || '').trim().toLowerCase() || ipKeyGenerator(req, res),
  message: message('Too many reset requests. Try again in an hour.'),
});

const resendVerificationLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  limit: 3,
  keyGenerator: (req, res) => (req.user?._id ? String(req.user._id) : ipKeyGenerator(req, res)),
  message: message('Too many verification emails. Try again in an hour.'),
});

const reportLimiter = rateLimit({
  ...base,
  windowMs: 24 * 60 * 60 * 1000,
  limit: 20,
  keyGenerator: (req, res) => (req.user?._id ? String(req.user._id) : ipKeyGenerator(req, res)),
  message: message('You have filed a lot of reports today. Try again tomorrow.'),
});

/** Catch-all, so no endpoint is completely unbounded. */
const globalLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 300,
  message: message('Slow down a moment, then try again.'),
});

module.exports = {
  loginLimiter,
  loginByEmailLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  resendVerificationLimiter,
  reportLimiter,
  globalLimiter,
};
