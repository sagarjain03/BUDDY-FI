const test = require('node:test');
const assert = require('node:assert/strict');

const { compareUsers, hasCompletedQuiz, answeredCount } = require('../utils/compatibility');

/**
 * Questions shaped the way the database stores them, so these tests exercise
 * the same path the app does. No database needed.
 */
const QUESTIONS = [
  {
    _id: 'q1',
    key: 'movie-genre',
    label: 'Movies',
    prompt: 'What type of movie do you love?',
    options: [
      { value: 'romance', label: 'Romantic Movies', group: 'feelgood' },
      { value: 'comedy', label: 'Comedies', group: 'feelgood' },
      { value: 'action', label: 'Action/Thriller Movies', group: 'highenergy' },
      { value: 'adventure', label: 'Adventure/Travel Movies', group: 'highenergy' },
    ],
  },
  {
    _id: 'q2',
    key: 'music-taste',
    label: 'Music',
    prompt: 'What music do you vibe to?',
    options: [
      { value: 'jazz', label: 'Jazz', group: 'band' },
      { value: 'rock', label: 'Rock/Alternative', group: 'band' },
      { value: 'pop', label: 'Pop Hits', group: 'charts' },
      { value: 'rap', label: 'Hip-Hop/Rap', group: 'charts' },
    ],
  },
];

const answering = (...values) => ({
  answers: values.map((value, index) => ({ question: QUESTIONS[index]._id, value })),
});

test('identical answers score 100%', () => {
  const result = compareUsers(answering('comedy', 'jazz'), answering('comedy', 'jazz'), QUESTIONS);

  assert.equal(result.percent, 100);
  assert.deepEqual(result.shared, ['Movies', 'Music']);
});

test('an answer in the same affinity group earns partial credit', () => {
  const result = compareUsers(answering('comedy'), answering('romance'), QUESTIONS);

  assert.equal(result.breakdown[0].match, 'similar');
  assert.equal(result.breakdown[0].points, 1);
  assert.deepEqual(result.shared, []);
});

test('an answer outside the group scores nothing', () => {
  const result = compareUsers(answering('comedy'), answering('action'), QUESTIONS);
  assert.equal(result.breakdown[0].match, 'none');
  assert.equal(result.score, 0);
});

test('exact beats similar beats none', () => {
  const exact = compareUsers(answering('comedy'), answering('comedy'), QUESTIONS).percent;
  const similar = compareUsers(answering('comedy'), answering('romance'), QUESTIONS).percent;
  const none = compareUsers(answering('comedy'), answering('action'), QUESTIONS).percent;

  assert.ok(exact > similar && similar > none);
});

test('the breakdown reports readable labels, not stored values', () => {
  const result = compareUsers(answering('comedy'), answering('romance'), QUESTIONS);

  assert.equal(result.breakdown[0].yours, 'Comedies');
  assert.equal(result.breakdown[0].theirs, 'Romantic Movies');
});

test('missing answers are ignored rather than throwing', () => {
  assert.doesNotThrow(() => compareUsers({}, {}, QUESTIONS));
  assert.doesNotThrow(() => compareUsers(undefined, undefined, QUESTIONS));

  const result = compareUsers({}, answering('comedy', 'jazz'), QUESTIONS);
  assert.equal(result.percent, 0);
  assert.ok(result.breakdown.every((row) => row.match === 'unanswered'));
});

test('scoring is symmetric', () => {
  const a = answering('comedy', 'jazz');
  const b = answering('action', 'pop');
  assert.equal(compareUsers(a, b, QUESTIONS).percent, compareUsers(b, a, QUESTIONS).percent);
});

test('legacy positional hobbies still score, so un-migrated members are not lost', () => {
  // hobby1..hobbyN mapped to the question order and stored the label.
  const legacy = { hobbies: { hobby1: 'Comedies', hobby2: 'Jazz' } };
  const modern = answering('comedy', 'jazz');

  const result = compareUsers(legacy, modern, QUESTIONS);
  assert.equal(result.percent, 100);
});

test('a legacy Mongoose Map is read the same as a plain object', () => {
  const asMap = { hobbies: new Map([['hobby1', 'Comedies']]) };
  const asObject = { hobbies: { hobby1: 'Comedies' } };

  assert.equal(compareUsers(asMap, asObject, QUESTIONS).score, 2);
});

test('the new answers array wins when a member has both', () => {
  const both = {
    hobbies: { hobby1: 'Action/Thriller Movies' },
    answers: [{ question: 'q1', value: 'comedy' }],
  };

  const result = compareUsers(both, answering('comedy'), QUESTIONS);
  assert.equal(result.breakdown[0].match, 'exact', 'answers must take precedence over hobbies');
});

test('completion counts the active questions, whatever their number', () => {
  assert.equal(hasCompletedQuiz(answering('comedy', 'jazz'), QUESTIONS), true);
  assert.equal(hasCompletedQuiz(answering('comedy'), QUESTIONS), false);
  assert.equal(hasCompletedQuiz({}, QUESTIONS), false);

  assert.equal(answeredCount(answering('comedy'), QUESTIONS), 1);
  assert.equal(answeredCount({}, QUESTIONS), 0);
});

test('adding a question makes previously complete members incomplete', () => {
  const user = answering('comedy', 'jazz');
  const extended = [
    ...QUESTIONS,
    {
      _id: 'q3',
      key: 'weekend',
      label: 'Weekends',
      prompt: 'Ideal weekend?',
      options: [{ value: 'in', label: 'Staying in' }],
    },
  ];

  assert.equal(hasCompletedQuiz(user, QUESTIONS), true);
  assert.equal(hasCompletedQuiz(user, extended), false);
});
