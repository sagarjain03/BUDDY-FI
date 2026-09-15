/**
 * Moves stored locations from { longitude, latitude } to GeoJSON.
 *
 *   node scripts/migrate-location.js            report only
 *   node scripts/migrate-location.js --apply    write the changes
 *
 * Safe to re-run: documents already in the new shape are skipped.
 */
require('dotenv').config();
const mongoose = require('mongoose');

const apply = process.argv.includes('--apply');

(async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set.');
    process.exit(1);
  }

  await mongoose.connect(
    process.env.MONGO_URI,
    process.env.MONGO_DB_NAME ? { dbName: process.env.MONGO_DB_NAME } : {}
  );
  const users = mongoose.connection.db.collection('users');
  console.log(`database: ${mongoose.connection.name}${apply ? '' : '  (dry run)'}`);

  const legacy = await users
    .find({ 'location.longitude': { $exists: true } })
    .project({ location: 1 })
    .toArray();

  console.log(`documents in the old shape: ${legacy.length}`);

  let migrated = 0;
  let cleared = 0;

  for (const doc of legacy) {
    const { longitude, latitude } = doc.location || {};

    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
      // Unusable coordinates have to go, not just be skipped: a single
      // malformed location makes the 2dsphere index build fail, which would
      // leave every $near query erroring.
      console.warn(`  clearing ${doc._id}: coordinates are not numbers`);
      if (apply) await users.updateOne({ _id: doc._id }, { $unset: { location: 1 } });
      cleared += 1;
      continue;
    }

    if (apply) {
      await users.updateOne(
        { _id: doc._id },
        {
          $set: {
            // [longitude, latitude] — that order, always.
            location: {
              type: 'Point',
              coordinates: [longitude, latitude],
              updatedAt: new Date(),
            },
          },
        }
      );
    }
    migrated += 1;
  }

  console.log(`${apply ? 'migrated' : 'would migrate'}: ${migrated}`);
  if (cleared) {
    console.log(`${apply ? 'cleared' : 'would clear'} (unusable coordinates): ${cleared}`);
  }

  if (apply) {
    try {
      await users.createIndex({ location: '2dsphere' });
      console.log('2dsphere index ensured');
    } catch (err) {
      console.error(
        '\n2dsphere index could NOT be built. Proximity search will not work until it is.\n' +
          'Usually one document still holds a location MongoDB cannot read:\n' +
          err.message
      );
      process.exitCode = 1;
    }
  }

  const remaining = await users.countDocuments({ 'location.longitude': { $exists: true } });
  console.log(`still in the old shape: ${remaining}`);

  await mongoose.disconnect();
})().catch((err) => {
  console.error('migration failed:', err.message);
  process.exit(1);
});
