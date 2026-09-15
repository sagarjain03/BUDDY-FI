const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const sendEmail = require('../utils/sendEmail');
const signToken = require('../utils/signToken');
const { createVerifyToken, createResetToken, hashToken } = require('../utils/authTokens');
const { sessionContext } = require('../utils/signToken');
const Session = require('../models/sessionModel');
const { verifyUnsubscribe } = require('../services/digestService');

const appUrl = () => process.env.APP_URL || 'http://localhost:5173';

/**
 * A JWT's `iat` is whole seconds, so a token minted in the same second as the
 * password change would look older than it and invalidate itself. Backdating by
 * a second keeps the freshly issued token valid while still killing every
 * token from before the change.
 */
const passwordChangedStamp = () => new Date(Date.now() - 1000);

const fail = (res, err, label) => {
  console.error(`${label} failed:`, err);
  res.status(500).json({ status: 'error', message: 'Something went wrong. Please try again.' });
};

/* -- emails ----------------------------------------------------------- */

async function deliverVerification(user) {
  const { raw, hash, expires } = createVerifyToken();

  user.verifyTokenHash = hash;
  user.verifyTokenExpires = expires;
  await user.save({ validateModifiedOnly: true });

  const link = `${appUrl()}/verify-email/${raw}`;

  await sendEmail({
    to: user.email,
    subject: 'Confirm your BUDDYFI email',
    text: `Welcome to BUDDYFI. Confirm your email within 24 hours: ${link}`,
    html: `<p>Welcome to BUDDYFI.</p><p><a href="${link}">Confirm your email</a></p><p>This link expires in 24 hours.</p>`,
  });

  return link;
}

/** Called by the register controller; failures must not fail registration. */
exports.deliverVerification = deliverVerification;

/* -- endpoints -------------------------------------------------------- */

/** POST /api/auth/verify-email/send — resend to the logged-in user. */
exports.resendVerification = async (req, res) => {
  try {
    if (req.user.isVerified) {
      return res.status(400).json({ status: 'error', message: 'Your email is already confirmed' });
    }

    await deliverVerification(req.user);
    res.status(200).json({ status: 'success', message: 'Verification email sent' });
  } catch (err) {
    fail(res, err, 'resendVerification');
  }
};

/** GET /api/auth/verify-email/:token */
exports.verifyEmail = async (req, res) => {
  try {
    const user = await User.findOne({
      verifyTokenHash: hashToken(req.params.token),
      verifyTokenExpires: { $gt: new Date() },
    }).select('+verifyTokenHash +verifyTokenExpires');

    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'That link is invalid or has expired. Ask for a new one.',
      });
    }

    user.isVerified = true;
    user.verifyTokenHash = undefined;
    user.verifyTokenExpires = undefined;
    await user.save({ validateModifiedOnly: true });

    res.status(200).json({ status: 'success', message: 'Email confirmed' });
  } catch (err) {
    fail(res, err, 'verifyEmail');
  }
};

/**
 * POST /api/auth/forgot-password  { email }
 *
 * Always answers the same way. Saying "no such account" here would turn this
 * into an account-enumeration oracle.
 */
exports.forgotPassword = async (req, res) => {
  const SAME_ANSWER = {
    status: 'success',
    message: 'If that email has an account, a reset link is on its way.',
  };

  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ status: 'error', message: 'Please provide your email' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(200).json(SAME_ANSWER);

    const { raw, hash, expires } = createResetToken();
    user.passwordResetTokenHash = hash;
    user.passwordResetExpires = expires;
    await user.save({ validateModifiedOnly: true });

    const link = `${appUrl()}/reset-password/${raw}`;

    await sendEmail({
      to: user.email,
      subject: 'Reset your BUDDYFI password',
      text: `Reset your password within the hour: ${link}. If you did not ask for this, ignore it.`,
      html: `<p>Reset your BUDDYFI password.</p><p><a href="${link}">Choose a new password</a></p><p>This link expires in one hour. If you did not ask for this, you can ignore this email.</p>`,
    });

    res.status(200).json(SAME_ANSWER);
  } catch (err) {
    console.error('forgotPassword failed:', err);
    // Still the same answer, so failures cannot be used to probe for accounts.
    res.status(200).json(SAME_ANSWER);
  }
};

/** POST /api/auth/reset-password/:token  { password, confirmPassword } */
exports.resetPassword = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;

    if (!password || password.length < 8) {
      return res
        .status(400)
        .json({ status: 'error', message: 'Please choose a password with 8 or more characters' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ status: 'error', message: 'Passwords do not match' });
    }

    const user = await User.findOne({
      passwordResetTokenHash: hashToken(req.params.token),
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetTokenHash +passwordResetExpires +password');

    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'That link is invalid or has expired. Ask for a new one.',
      });
    }

    user.password = await bcrypt.hash(password, 12);
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpires = undefined;
    // Kills every token issued before now, including whoever may have had one.
    user.passwordChangedAt = passwordChangedStamp();
    await user.save({ validateModifiedOnly: true });

    // Every other device is logged out, so drop their session rows too.
    await Session.deleteMany({ user: user._id });

    res.status(200).json({
      status: 'success',
      message: 'Password updated. You are logged in on this device.',
      token: await signToken(user._id, sessionContext(req)),
    });
  } catch (err) {
    fail(res, err, 'resetPassword');
  }
};

/**
 * GET /api/auth/unsubscribe/:userId/:token
 * Deliberately unauthenticated — an unsubscribe link that needs a login is not
 * an unsubscribe link.
 */
exports.unsubscribeDigest = async (req, res) => {
  try {
    const { userId, token } = req.params;

    if (!verifyUnsubscribe(userId, token)) {
      return res.status(400).json({ status: 'error', message: 'That link is not valid.' });
    }

    await User.updateOne({ _id: userId }, { $set: { 'emailPrefs.digest': false } });
    res.status(200).json({ status: 'success', message: 'You will not get the weekly email.' });
  } catch (err) {
    fail(res, err, 'unsubscribeDigest');
  }
};

/** POST /api/auth/logout — ends this session for real. */
exports.logout = async (req, res) => {
  try {
    if (req.session) await Session.deleteOne({ _id: req.session._id });
    res.status(200).json({ status: 'success', message: 'Logged out' });
  } catch (err) {
    fail(res, err, 'logout');
  }
};

/** GET /api/auth/sessions — where this account is currently signed in. */
exports.listSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ user: req.user._id }).sort({ lastSeenAt: -1 });

    res.status(200).json({
      status: 'success',
      results: sessions.length,
      data: {
        sessions: sessions.map((session) => ({
          _id: session._id,
          userAgent: session.userAgent,
          lastSeenAt: session.lastSeenAt,
          createdAt: session.createdAt,
          current: String(session._id) === String(req.session?._id),
        })),
      },
    });
  } catch (err) {
    fail(res, err, 'listSessions');
  }
};

/** DELETE /api/auth/sessions — log out everywhere except here. */
exports.endOtherSessions = async (req, res) => {
  try {
    const result = await Session.deleteMany({
      user: req.user._id,
      _id: { $ne: req.session?._id },
    });

    res.status(200).json({
      status: 'success',
      message: 'Signed out of ' + result.deletedCount + ' other device' +
        (result.deletedCount === 1 ? '' : 's') + '.',
    });
  } catch (err) {
    fail(res, err, 'endOtherSessions');
  }
};

/** PATCH /api/auth/change-password  { currentPassword, password, confirmPassword } */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, password, confirmPassword } = req.body;

    if (!currentPassword || !password) {
      return res
        .status(400)
        .json({ status: 'error', message: 'Provide your current and new password' });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ status: 'error', message: 'Please choose a password with 8 or more characters' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ status: 'error', message: 'Passwords do not match' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(401).json({ status: 'error', message: 'Your current password is wrong' });
    }

    user.password = await bcrypt.hash(password, 12);
    user.passwordChangedAt = passwordChangedStamp();
    await user.save({ validateModifiedOnly: true });

    await Session.deleteMany({ user: user._id });

    res.status(200).json({
      status: 'success',
      message: 'Password changed. Other devices have been logged out.',
      // The caller's own token was just invalidated, so hand back a fresh one.
      token: await signToken(user._id, sessionContext(req)),
    });
  } catch (err) {
    fail(res, err, 'changePassword');
  }
};
