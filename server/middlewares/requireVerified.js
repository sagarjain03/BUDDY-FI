/**
 * Gates the social surface on a confirmed email address.
 *
 * Unverified accounts can still log in, finish the quiz and manage their own
 * profile — they simply cannot reach other people until the address is real.
 * Runs after `protect`, which puts the user on the request.
 */
/** Admin-only routes. Runs after protect. */
exports.requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ status: 'error', message: 'Admins only.' });
  }
  next();
};

exports.requireVerified = (req, res, next) => {
  if (!req.user?.isVerified) {
    return res.status(403).json({
      status: 'error',
      code: 'EMAIL_NOT_VERIFIED',
      message: 'Confirm your email address to use this.',
    });
  }
  next();
};
