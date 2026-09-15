/**
 * Deletes accounts created by the Playwright suite.
 *
 *   node scripts/cleanup-test-users.js
 *
 * Only touches users whose email starts with the test prefix, and refuses to
 * run against a database that does not look like a test database unless
 * ALLOW_CLEANUP_ON=<dbname> is set explicitly.
 */
require('dotenv').config();
const mongoose = require('mongoose');

const PREFIX = 'pwtest-';
const dbName = process.env.SMOKE_DB_NAME || process.env.MONGO_DB_NAME;

const looksLikeTestDb = (name) => /test/i.test(name || '');

(async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set.');
    process.exit(1);
  }

  if (!looksLikeTestDb(dbName) && process.env.ALLOW_CLEANUP_ON !== dbName) {
    console.error(
      `Refusing to clean "${dbName}" — it does not look like a test database.\n` +
        `Set SMOKE_DB_NAME to a test database, or ALLOW_CLEANUP_ON=${dbName} to override.`
    );
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI, dbName ? { dbName } : {});

  const result = await mongoose.connection.db
    .collection('users')
    .deleteMany({ email: { $regex: `^${PREFIX}` } });

  console.log(`cleanup: removed ${result.deletedCount} test users from "${mongoose.connection.name}"`);
  await mongoose.disconnect();
})().catch((err) => {
  console.error('cleanup failed:', err.message);
  process.exit(1);
});
