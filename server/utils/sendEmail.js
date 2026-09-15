const fs = require('fs');
const path = require('path');

const DEV_INBOX = path.join(__dirname, '..', '.dev-emails');
const MAX_KEPT = 200;

/**
 * Transport is chosen by configuration, not by guessing:
 *   EMAIL_TRANSPORT=resend   send for real (needs EMAIL_PROVIDER_API_KEY)
 *   EMAIL_TRANSPORT=file     write to server/.dev-emails (the default off prod)
 *   EMAIL_TRANSPORT=console  log the message and move on
 *
 * The file transport is what the dev inbox at /api/dev/emails reads, so the
 * whole verification and reset flow can be exercised without a provider.
 */
function transportName() {
  if (process.env.EMAIL_TRANSPORT) return process.env.EMAIL_TRANSPORT;
  if (process.env.NODE_ENV === 'production') return 'resend';
  return 'file';
}

function writeToDevInbox(mail) {
  fs.mkdirSync(DEV_INBOX, { recursive: true });

  const record = { ...mail, sentAt: new Date().toISOString() };
  const file = path.join(DEV_INBOX, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`);
  fs.writeFileSync(file, JSON.stringify(record, null, 2));

  // Keep the folder from growing without bound during long test runs.
  const files = fs.readdirSync(DEV_INBOX).sort();
  for (const stale of files.slice(0, Math.max(0, files.length - MAX_KEPT))) {
    try {
      fs.unlinkSync(path.join(DEV_INBOX, stale));
    } catch {
      /* already gone */
    }
  }
}

async function sendViaResend({ to, subject, html, text }) {
  const key = process.env.EMAIL_PROVIDER_API_KEY;
  if (!key) {
    throw new Error('EMAIL_PROVIDER_API_KEY is not set but EMAIL_TRANSPORT is "resend"');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'BUDDYFI <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    throw new Error(`email provider returned ${response.status}: ${await response.text()}`);
  }
}

/**
 * Sends one email. Never throws at the call site — a provider outage must not
 * turn a successful registration into a 500 — but the failure is logged.
 */
async function sendEmail({ to, subject, html, text }) {
  const mail = { to, subject, html, text };
  const transport = transportName();

  try {
    if (transport === 'resend') {
      await sendViaResend(mail);
    } else if (transport === 'console') {
      console.log(`\n--- email to ${to} ---\n${subject}\n${text || html}\n---\n`);
    } else {
      writeToDevInbox(mail);
    }
    return { ok: true, transport };
  } catch (err) {
    console.error(`sendEmail failed (${transport}):`, err.message);
    return { ok: false, transport, error: err.message };
  }
}

module.exports = sendEmail;
module.exports.DEV_INBOX = DEV_INBOX;
module.exports.transportName = transportName;
