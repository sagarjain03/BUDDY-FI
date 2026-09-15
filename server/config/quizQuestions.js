/**
 * The seven quiz questions, mirrored from the client so the matcher can label
 * and group answers.
 *
 * `answers` on a user are stored as hobby1..hobby7, positionally matching this
 * array. Phase 09 moves all of this into the database and removes the
 * positional convention — until then, THIS ORDER MUST MATCH
 * client/src/components/Questionpage/QuestionPage.jsx exactly.
 *
 * `groups` lists sets of options that are close enough to earn partial credit
 * when two people did not pick the identical answer. An option in no group only
 * ever matches itself.
 */
const QUESTIONS = [
  {
    key: 'movie-genre',
    label: 'Movies',
    prompt: 'What type of movie do you love watching on repeat?',
    options: [
      'Romantic Movies',
      'Adventure/Travel Movies',
      'Comedies',
      'Action/Thriller Movies',
    ],
    groups: [
      ['Adventure/Travel Movies', 'Action/Thriller Movies'], // high energy
      ['Romantic Movies', 'Comedies'], // feel good
    ],
  },
  {
    key: 'weekend-plans',
    label: 'Weekends',
    prompt: 'How do you spend your ideal weekend?',
    options: [
      'Hanging out with friends',
      'Exploring new places',
      'Binge-watching TV shows',
      'Reading a good book',
    ],
    groups: [
      ['Hanging out with friends', 'Exploring new places'], // out and about
      ['Binge-watching TV shows', 'Reading a good book'], // quiet indoors
    ],
  },
  {
    key: 'music-taste',
    label: 'Music',
    prompt: 'What type of music do you vibe to?',
    options: ['Pop Hits', 'Jazz', 'Rock/Alternative', 'Hip-Hop/Rap'],
    groups: [
      ['Pop Hits', 'Hip-Hop/Rap'], // chart driven
      ['Jazz', 'Rock/Alternative'], // band driven
    ],
  },
  {
    key: 'communication',
    label: 'Talks via',
    prompt: 'How do you prefer to communicate with friends?',
    options: ['In-person hangouts', 'Video Calls', 'Texting/Messaging', 'Voice Notes'],
    groups: [
      ['In-person hangouts', 'Video Calls'], // face to face
      ['Texting/Messaging', 'Voice Notes'], // asynchronous
    ],
  },
  {
    key: 'vacation',
    label: 'Travel',
    prompt: 'What kind of vacation do you dream of?',
    options: ['Beach Relaxation', 'Mountain Trekking', 'City Exploration', 'Cultural Tour'],
    groups: [
      ['Beach Relaxation', 'Cultural Tour'], // slow travel
      ['Mountain Trekking', 'City Exploration'], // active travel
    ],
  },
  {
    key: 'tough-day',
    label: 'Tough days',
    prompt: 'How do you usually handle a tough day?',
    options: [
      'Venting to a friend',
      'Working out or going for a run',
      'Meditating or practicing mindfulness',
      'Powering through with determination',
    ],
    groups: [
      ['Working out or going for a run', 'Powering through with determination'], // push through
      ['Venting to a friend', 'Meditating or practicing mindfulness'], // process it
    ],
  },
  {
    key: 'social-setting',
    label: 'Socialising',
    prompt: 'What kind of social setting do you prefer?',
    options: [
      'Small gathering with close friends',
      'Big parties or events',
      'Quiet one-on-one conversations',
      'Hanging out with different groups',
    ],
    groups: [
      ['Big parties or events', 'Hanging out with different groups'], // wide circle
      ['Small gathering with close friends', 'Quiet one-on-one conversations'], // close circle
    ],
  },
];

/** hobby1..hobby7 — the keys used inside a user's `hobbies` map. */
const ANSWER_KEYS = QUESTIONS.map((_, index) => `hobby${index + 1}`);

module.exports = { QUESTIONS, ANSWER_KEYS };
