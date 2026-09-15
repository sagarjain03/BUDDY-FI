/**
 * Moves the quiz into the database.
 *
 *   node scripts/migrate-quiz.js            report only
 *   node scripts/migrate-quiz.js --apply    seed questions and migrate answers
 *
 * Safe to re-run. `hobbies` is left in place on purpose — drop it in a
 * follow-up once the new answers have been verified in the wild.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Question = require('../models/questionModel');
const { QUESTIONS } = require('../config/quizQuestions');

const apply = process.argv.includes('--apply');

/** Turns a display label into a stable value: 'Rock/Alternative' -> 'rock-alternative'. */
const slug = (label) =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** The affinity group an option belongs to, from the hardcoded config. */
function groupFor(question, option) {
  const index = (question.groups || []).findIndex((group) => group.includes(option));
  return index === -1 ? undefined : `${question.key}-g${index + 1}`;
}

async function seedQuestions() {
  let created = 0;
  let updated = 0;

  for (const [index, source] of QUESTIONS.entries()) {
    const doc = {
      key: source.key,
      prompt: source.prompt,
      label: source.label,
      order: index,
      isActive: true,
      options: source.options.map((option) => ({
        value: slug(option),
        label: option,
        group: groupFor(source, option),
      })),
    };

    const existing = await Question.findOne({ key: source.key });
    if (existing) {
      if (apply) await Question.updateOne({ key: source.key }, { $set: doc });
      updated += 1;
    } else {
      if (apply) await Question.create(doc);
      created += 1;
    }
  }

  return { created, updated };
}

async function migrateAnswers() {
  const questions = apply
    ? await Question.find({}).sort({ order: 1 }).lean()
    : QUESTIONS.map((q, order) => ({
        ...q,
        _id: q.key,
        order,
        options: q.options.map((o) => ({ value: slug(o), label: o })),
      }));

  const users = mongoose.connection.db.collection('users');
  const pending = await users
    .find({ hobbies: { $exists: true, $ne: null }, answers: { $in: [null, []] } })
    .project({ hobbies: 1 })
    .toArray();

  let migrated = 0;
  let unresolved = 0;

  for (const user of pending) {
    const answers = [];

    questions.forEach((question, index) => {
      const label = user.hobbies?.[`hobby${index + 1}`];
      if (!label) return;

      const option = question.options.find(
        (candidate) => candidate.label === label || candidate.value === label
      );

      if (!option) {
        console.warn(`  could not resolve "${label}" for ${user._id} (${question.key})`);
        unresolved += 1;
        return;
      }

      answers.push({
        question: question._id,
        value: option.value,
        answeredAt: new Date(),
      });
    });

    if (answers.length === 0) continue;
    if (apply) await users.updateOne({ _id: user._id }, { $set: { answers } });
    migrated += 1;
  }

  return { migrated, unresolved, candidates: pending.length };
}

(async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set.');
    process.exit(1);
  }

  await mongoose.connect(
    process.env.MONGO_URI,
    process.env.MONGO_DB_NAME ? { dbName: process.env.MONGO_DB_NAME } : {}
  );
  console.log(`database: ${mongoose.connection.name}${apply ? '' : '  (dry run)'}`);

  const seeded = await seedQuestions();
  console.log(`questions — new: ${seeded.created}, refreshed: ${seeded.updated}`);

  const result = await migrateAnswers();
  console.log(
    `${apply ? 'migrated' : 'would migrate'}: ${result.migrated} of ${result.candidates} members`
  );

  if (result.unresolved > 0) {
    console.warn(
      `\n${result.unresolved} answer(s) could not be resolved to an option. ` +
        'Investigate those before dropping the hobbies field.'
    );
    process.exitCode = 1;
  }

  await mongoose.disconnect();
})().catch((err) => {
  console.error('quiz migration failed:', err.message);
  process.exit(1);
});
