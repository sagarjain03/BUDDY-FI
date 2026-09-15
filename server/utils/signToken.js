const jwt = require('jsonwebtoken');
const Session = require('../models/sessionModel');

const DEFAULT_EXPIRY = '7d';

/**
 * Days in a token lifetime, so the session record expires with the token it
 * belongs to. Only the simple forms the app actually uses are parsed.
 */
function expiryDays() {
  const raw = process.env.JWT_EXPIRES_IN || DEFAULT_EXPIRY;
  const match = String(raw).match(/^(\d+)([dhm])$/);
  if (!match) return 7;

  const value = Number(match[1]);
  if (match[2] === 'd') return value;
  if (match[2] === 'h') return value / 24;
  return value / (24 * 60);
}

/**
 * Creates a session row and signs a token bound to it.
 *
 * The session id inside the token is what makes logout real: `protect` checks
 * the row still exists, so deleting it kills the token immediately instead of
 * waiting for it to expire.
 */
async function createSession(userId, { userAgent, ip } = {}) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set. Add it to your .env file.');
  }

  const expiresAt = new Date(Date.now() + expiryDays() * 24 * 60 * 60 * 1000);

  const session = await Session.create({
    user: userId,
    userAgent: userAgent?.slice(0, 300),
    ip: ip?.slice(0, 64),
    expiresAt,
  });

  const token = jwt.sign({ id: userId, sid: String(session._id) }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || DEFAULT_EXPIRY,
  });

  return { token, session };
}

/** Convenience for callers that only need the token string. */
async function signToken(userId, context) {
  const { token } = await createSession(userId, context);
  return token;
}

/** Context for the session row, taken from the request. */
const sessionContext = (req) => ({
  userAgent: req.get?.('user-agent'),
  ip: req.ip,
});

module.exports = signToken;
module.exports.createSession = createSession;
module.exports.sessionContext = sessionContext;
module.exports.expiryDays = expiryDays;
