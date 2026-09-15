const Question = require('../models/questionModel');

/**
 * Questions change rarely and are read on nearly every request, so they are
 * cached in process. Any write path should call `invalidate()`.
 */
const TTL_MS = Number(process.env.QUESTION_CACHE_MS) || 60_000;

let cache = null;
let cachedAt = 0;

async function getQuestions({ force = false } = {}) {
  if (!force && cache && Date.now() - cachedAt < TTL_MS) return cache;

  cache = await Question.find({ isActive: true }).sort({ order: 1 }).lean();
  cachedAt = Date.now();
  return cache;
}

function invalidate() {
  cache = null;
  cachedAt = 0;
}

/**
 * A member's answers as questionId -> optionValue.
 *
 * Reads the new `answers` array, and falls back to the legacy `hobbies` map for
 * anyone not migrated yet. `hobbies` was positional (hobby1..hobbyN against the
 * question order), which is exactly the fragility this phase removes.
 */
function answerMap(user, questions) {
  const map = new Map();

  if (Array.isArray(user?.answers) && user.answers.length > 0) {
    for (const answer of user.answers) {
      if (answer?.question && answer?.value) {
        map.set(String(answer.question), answer.value);
      }
    }
    return map;
  }

  const hobbies = user?.hobbies;
  if (!hobbies) return map;

  const legacy = typeof hobbies.get === 'function' ? Object.fromEntries(hobbies) : hobbies;

  questions.forEach((question, index) => {
    const label = legacy[`hobby${index + 1}`];
    if (!label) return;

    const option = question.options.find(
      (candidate) => candidate.label === label || candidate.value === label
    );
    if (option) map.set(String(question._id), option.value);
  });

  return map;
}

module.exports = { getQuestions, invalidate, answerMap };
