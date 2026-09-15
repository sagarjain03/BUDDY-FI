const User = require('../models/userModel');
const { compareUsers, hasCompletedQuiz, answeredCount } = require('../utils/compatibility');
const { getQuestions } = require('../services/questionService');
const { statusMapFor, describe, findBetween } = require('../utils/connections');
const { hasPoint, distanceKm, displayDistance } = require('../utils/geo');
const { blockedIdsFor, isBlockedBetween } = require('../utils/blocks');

// Fields safe to send about another member. Never include email.
const PUBLIC_FIELDS =
  'name age gender hobbies answers avatar bio interests createdAt location shareLocation ' +
  'isOnline lastSeenAt sharePresence';

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  age: user.age,
  gender: user.gender,
  avatar: user.avatar?.url ? user.avatar : undefined,
  bio: user.bio,
  interests: user.interests,
  hobbies: user.hobbies,
  joinedAt: user.createdAt,
  ...presenceOf(user),
});

/** Presence is only shown when the member left it switched on. */
function presenceOf(user) {
  if (user.sharePresence === false) return {};
  return { isOnline: Boolean(user.isOnline), lastSeenAt: user.lastSeenAt };
}

/**
 * Distance from the caller, as a band. Returns null when either side has no
 * location or the other member has turned sharing off. Raw coordinates never
 * leave this function.
 */
const distanceFor = (viewer, other) => {
  if (!hasPoint(viewer.location) || !hasPoint(other.location)) return null;
  if (other.shareLocation === false) return null;
  return displayDistance(distanceKm(viewer.location, other.location));
};

/**
 * GET /api/discover
 *
 * Ranked matches for the caller, best first. Members who have not finished the
 * quiz cannot be scored, so they are returned separately as `newMembers`
 * instead of being ranked at 0% among real matches.
 */
exports.listMatches = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_LIMIT));
    const minScore = Math.min(100, Math.max(0, parseInt(req.query.minScore, 10) || 0));
    const sort = ['newest', 'distance'].includes(req.query.sort) ? req.query.sort : 'match';

    const radiusKm = Number.parseInt(req.query.radius, 10);
    const viewerHasLocation = hasPoint(req.user.location);
    // A radius filter is meaningless without the caller's own position, and
    // would otherwise silently hide everyone.
    const useRadius = Number.isFinite(radiusKm) && radiusKm > 0 && viewerHasLocation;

    // Blocks are symmetric: people you blocked and people who blocked you are
    // both invisible here.
    const [blocked, questions] = await Promise.all([
      blockedIdsFor(req.user._id),
      getQuestions(),
    ]);

    const query = {
      _id: { $ne: req.user._id, $nin: blocked },
      name: { $exists: true, $ne: null },
      isVerified: true,
    };

    if (useRadius) {
      // $near uses the 2dsphere index, so the database does the filtering.
      query.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: req.user.location.coordinates },
          $maxDistance: radiusKm * 1000,
        },
      };
      query.shareLocation = { $ne: false };
    }

    const [candidates, connectionStatus] = await Promise.all([
      User.find(query).select(PUBLIC_FIELDS),
      statusMapFor(req.user._id),
    ]);

    const connectionFor = (id) =>
      connectionStatus.get(String(id)) || { status: 'none', id: null };

    const newMembers = [];
    let matches = [];

    for (const candidate of candidates) {
      const distance = distanceFor(req.user, candidate);

      if (!hasCompletedQuiz(candidate, questions)) {
        newMembers.push({
          user: publicUser(candidate),
          connection: connectionFor(candidate._id),
          distance,
        });
        continue;
      }

      const { percent, shared } = compareUsers(req.user, candidate, questions);
      matches.push({
        user: publicUser(candidate),
        percent,
        shared,
        connection: connectionFor(candidate._id),
        distance,
      });
    }

    newMembers.sort((a, b) => new Date(b.user.joinedAt) - new Date(a.user.joinedAt));

    matches = matches.filter((match) => match.percent >= minScore);

    matches.sort((a, b) => {
      if (sort === 'newest') return new Date(b.user.joinedAt) - new Date(a.user.joinedAt);

      if (sort === 'distance') {
        // Members with no distance sink to the bottom rather than reading as
        // "zero km away".
        const aKm = a.distance ? (a.distance.km ?? 0) : Number.POSITIVE_INFINITY;
        const bKm = b.distance ? (b.distance.km ?? 0) : Number.POSITIVE_INFINITY;
        return aKm - bKm || b.percent - a.percent;
      }

      return b.percent - a.percent || a.user.name.localeCompare(b.user.name);
    });

    const total = matches.length;
    const start = (page - 1) * limit;

    res.status(200).json({
      status: 'success',
      results: Math.min(limit, Math.max(0, total - start)),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      // The caller cannot be scored against anyone until they finish the quiz.
      quizComplete: hasCompletedQuiz(req.user, questions),
      hasLocation: viewerHasLocation,
      radius: useRadius ? radiusKm : null,
      answered: answeredCount(req.user, questions),
      totalQuestions: questions.length,
      data: {
        matches: matches.slice(start, start + limit),
        // Only worth showing on the first page.
        newMembers: page === 1 ? newMembers.slice(0, 6) : [],
      },
    });
  } catch (err) {
    console.error('listMatches failed:', err);
    res.status(500).json({ status: 'error', message: 'Something went wrong. Please try again.' });
  }
};

/**
 * GET /api/discover/:id
 * One member plus the full question-by-question comparison against the caller.
 */
exports.getMatch = async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user._id)) {
      return res.status(400).json({ status: 'error', message: 'That is you.' });
    }

    // A blocked member must not be reachable by guessing their id either.
    if (await isBlockedBetween(req.user._id, req.params.id)) {
      return res.status(404).json({ status: 'error', message: 'Member not found' });
    }

    const other = await User.findById(req.params.id).select(PUBLIC_FIELDS);
    if (!other) {
      return res.status(404).json({ status: 'error', message: 'Member not found' });
    }

    const questions = await getQuestions();
    const { percent, shared, breakdown } = compareUsers(req.user, other, questions);
    const connection = await findBetween(req.user._id, other._id);
    const distance = distanceFor(req.user, other);

    res.status(200).json({
      status: 'success',
      data: {
        user: publicUser(other),
        percent,
        shared,
        breakdown,
        quizComplete: hasCompletedQuiz(other, questions),
        connection: describe(connection, req.user._id),
        distance,
      },
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ status: 'error', message: 'Member not found' });
    }
    console.error('getMatch failed:', err);
    res.status(500).json({ status: 'error', message: 'Something went wrong. Please try again.' });
  }
};
