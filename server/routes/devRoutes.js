const express = require('express');
const fs = require('fs');
const path = require('path');
const { DEV_INBOX } = require('../utils/sendEmail');

/**
 * A local inbox, so the verification and reset flows can be exercised without
 * an email provider. This router is only mounted off production — see app.js.
 */
const router = express.Router();

const readInbox = () => {
  if (!fs.existsSync(DEV_INBOX)) return [];

  return fs
    .readdirSync(DEV_INBOX)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .reverse()
    .map((name) => {
      try {
        return JSON.parse(fs.readFileSync(path.join(DEV_INBOX, name), 'utf8'));
      } catch {
        return null;
      }
    })
    .filter(Boolean);
};

router.get('/emails', (req, res) => {
  const { to } = req.query;
  const all = readInbox();
  const emails = to ? all.filter((mail) => mail.to === to) : all;

  res.status(200).json({ status: 'success', results: emails.length, data: { emails } });
});

router.get('/emails/latest', (req, res) => {
  const { to } = req.query;
  if (!to) {
    return res.status(400).json({ status: 'error', message: 'Pass ?to=<email>' });
  }

  const email = readInbox().find((mail) => mail.to === to);
  if (!email) {
    return res.status(404).json({ status: 'error', message: 'No email for that address yet' });
  }

  res.status(200).json({ status: 'success', data: { email } });
});

module.exports = router;
