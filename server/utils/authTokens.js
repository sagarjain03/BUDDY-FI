const crypto = require('crypto');

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const RESET_TTL_MS = 60 * 60 * 1000; //  1 hour

/**
 * Only the hash is stored. The raw value goes in the emailed link, so a leaked
 * database does not hand out working verification or reset links — the same
 * reasoning as hashing passwords.
 */
function createToken(ttlMs) {
  const raw = crypto.randomBytes(32).toString('hex');
  return {
    raw,
    hash: hashToken(raw),
    expires: new Date(Date.now() + ttlMs),
  };
}

function hashToken(raw) {
  return crypto.createHash('sha256').update(String(raw)).digest('hex');
}

const createVerifyToken = () => createToken(VERIFY_TTL_MS);
const createResetToken = () => createToken(RESET_TTL_MS);

module.exports = {
  createVerifyToken,
  createResetToken,
  hashToken,
  VERIFY_TTL_MS,
  RESET_TTL_MS,
};
