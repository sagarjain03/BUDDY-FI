const { answerMap } = require('../services/questionService');

const EXACT_POINTS = 2;
const GROUP_POINTS = 1;

/** The option a member picked for one question, or null. */
const pick = (answers, question) => answers.get(String(question._id)) || null;

const optionOf = (question, value) =>
  question.options.find((option) => option.value === value) || null;

/** True when both options sit in the same affinity group for that question. */
function sameGroup(question, valueA, valueB) {
  const a = optionOf(question, valueA);
  const b = optionOf(question, valueB);
  return Boolean(a?.group && b?.group && a.group === b.group);
}

/** How many of the active questions this member has answered. */
function answeredCount(user, questions) {
  const answers = answerMap(user, questions);
  return questions.filter((question) => pick(answers, question)).length;
}

const hasCompletedQuiz = (user, questions) =>
  questions.length > 0 && answeredCount(user, questions) === questions.length;

/**
 * Scores two members against each other.
 *
 * Identical answer = 2 points, same affinity group = 1, otherwise 0. A question
 * either side left blank scores 0 rather than throwing.
 *
 * @returns {{ score, percent, shared: string[], breakdown: object[] }}
 */
function compareUsers(userA, userB, questions) {
  const a = answerMap(userA, questions);
  const b = answerMap(userB, questions);
  const max = questions.length * EXACT_POINTS;

  let score = 0;
  const shared = [];
  const breakdown = [];

  for (const question of questions) {
    const valueA = pick(a, question);
    const valueB = pick(b, question);

    let points = 0;
    let match = 'none';

    if (valueA && valueB) {
      if (valueA === valueB) {
        points = EXACT_POINTS;
        match = 'exact';
        shared.push(question.label);
      } else if (sameGroup(question, valueA, valueB)) {
        points = GROUP_POINTS;
        match = 'similar';
      }
    } else {
      match = 'unanswered';
    }

    score += points;
    breakdown.push({
      key: question.key,
      label: question.label,
      prompt: question.prompt,
      yours: optionOf(question, valueA)?.label || null,
      theirs: optionOf(question, valueB)?.label || null,
      match,
      points,
    });
  }

  return {
    score,
    percent: max === 0 ? 0 : Math.round((score / max) * 100),
    shared,
    breakdown,
  };
}

module.exports = {
  compareUsers,
  hasCompletedQuiz,
  answeredCount,
  EXACT_POINTS,
  GROUP_POINTS,
};
