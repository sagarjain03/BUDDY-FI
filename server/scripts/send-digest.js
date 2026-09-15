/**
 * Weekly digest.
 *
 *   node scripts/send-digest.js            report what would be sent
 *   node scripts/send-digest.js --send     actually send
 *
 * Run it from a scheduler (cron, or the host's scheduled jobs). Running it
 * in-process on more than one instance would send duplicates.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { sendWeeklyDigest } = require('../services/digestService');

const send = process.argv.includes('--send');

(async () => {
  await mongoose.connect(
    process.env.MONGO_URI,
    process.env.MONGO_DB_NAME ? { dbName: process.env.MONGO_DB_NAME } : {}
  );

  const result = await sendWeeklyDigest({ dryRun: !send });
  console.log(
    `${send ? 'sent' : 'would send'}: ${result.sent} | skipped (nothing to say): ${result.skipped} | considered: ${result.considered}`
  );

  await mongoose.disconnect();
})().catch((err) => {
  console.error('digest failed:', err.message);
  process.exit(1);
});
