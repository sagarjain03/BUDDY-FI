const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Session = require('../models/sessionModel');

// Verifies the Bearer token and attaches the matching user to req.user.
exports.protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'You are not logged in. Please log in to get access.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('+passwordChangedAt');
    if (!user) {
      return res.status(401).json({ message: 'The user belonging to this token no longer exists.' });
    }

    // Tokens are bound to a session row. Deleting the row logs that device out
    // straight away, rather than waiting for the token to expire.
    if (decoded.sid) {
      const session = await Session.findOne({ _id: decoded.sid, user: user._id });
      if (!session) {
        return res.status(401).json({ message: 'This session has ended. Please log in again.' });
      }

      // Cheap freshness stamp, at most once a minute.
      if (Date.now() - session.lastSeenAt.getTime() > 60_000) {
        session.lastSeenAt = new Date();
        await session.save();
      }

      req.session = session;
    }

    // Tokens minted before the last password change are dead. This is the only
    // revocation mechanism until phase 07 adds refresh tokens.
    if (user.passwordChangedAt && decoded.iat * 1000 < user.passwordChangedAt.getTime()) {
      return res
        .status(401)
        .json({ message: 'Password recently changed. Please log in again.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Your session has expired. Please log in again.' });
    }
    return res.status(401).json({ message: 'Invalid token. Please log in again.' });
  }
};
