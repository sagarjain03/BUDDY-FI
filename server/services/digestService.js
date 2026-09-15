const crypto = require('crypto');
const User = require('../models/userModel');
const Connection = require('../models/connectionModel');
const Conversation = require('../models/conversationModel');
const sendEmail = require('../utils/sendEmail');

const appUrl = () => process.env.APP_URL || 'http://localhost:5173';

/**
 * Unsubscribe has to work without logging in, so the link carries a signature
 * derived from JWT_SECRET rather than a session.
 */
function unsubscribeToken(userId) {
  return crypto
    .createHmac('sha256', process.env.JWT_SECRET || 'unset')
    .update(`digest:${userId}`)
    .digest('hex');
}

const verifyUnsubscribe = (userId, token) => {
  const expected = unsubscribeToken(userId);
  // Lengths match by construction, so a timing-safe compare is straightforward.
  return (
    token &&
    token.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))
  );
};

/** What this member would actually be told about. Empty means do not send. */
async function digestFor(user) {
  const [pending, conversations] = await Promise.all([
    Connection.countDocuments({ status: 'pending', recipient: user._id }),
    Conversation.find({ participants: user._id }).select('unread'),
  ]);

  const unread = conversations.reduce(
    (sum, conversation) => sum + (conversation.unread?.get?.(String(user._id)) || 0),
    0
  );

  return { pending, unread, hasSomething: pending > 0 || unread > 0 };
}

function renderDigest(user, digest) {
  const lines = [];
  if (digest.pending > 0) {
    lines.push(
      `${digest.pending} connection request${digest.pending === 1 ? '' : 's'} waiting for you`
    );
  }
  if (digest.unread > 0) {
    lines.push(`${digest.unread} unread message${digest.unread === 1 ? '' : 's'}`);
  }

  const unsubscribe = `${appUrl()}/unsubscribe/${user._id}/${unsubscribeToken(user._id)}`;

  return {
    subject: 'Your week on BUDDYFI',
    text:
      `Hi ${user.name.split(' ')[0]},\n\n` +
      lines.map((line) => `- ${line}`).join('\n') +
      `\n\nOpen BUDDYFI: ${appUrl()}/welcome\n\n` +
      `Do not want these? Unsubscribe: ${unsubscribe}\n`,
    html:
      `<p>Hi ${user.name.split(' ')[0]},</p>` +
      `<ul>${lines.map((line) => `<li>${line}</li>`).join('')}</ul>` +
      `<p><a href="${appUrl()}/welcome">Open BUDDYFI</a></p>` +
      `<p style="font-size:12px;color:#888">Do not want these? <a href="${unsubscribe}">Unsubscribe</a>.</p>`,
  };
}

/**
 * Sends the weekly digest.
 *
 * Skips unverified addresses, anyone who opted out, and anyone with nothing to
 * report — an empty digest is spam.
 */
async function sendWeeklyDigest({ dryRun = false } = {}) {
  const candidates = await User.find({
    isVerified: true,
    'emailPrefs.digest': { $ne: false },
  }).select('name email emailPrefs');

  let sent = 0;
  let skipped = 0;

  for (const user of candidates) {
    const digest = await digestFor(user);
    if (!digest.hasSomething) {
      skipped += 1;
      continue;
    }

    if (!dryRun) {
      const mail = renderDigest(user, digest);
      await sendEmail({ to: user.email, ...mail });
    }
    sent += 1;
  }

  return { considered: candidates.length, sent, skipped };
}

module.exports = {
  sendWeeklyDigest,
  digestFor,
  renderDigest,
  unsubscribeToken,
  verifyUnsubscribe,
};
