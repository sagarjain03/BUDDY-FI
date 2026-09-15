const Block = require('../models/blockModel');
const Connection = require('../models/connectionModel');

/**
 * Every user id that should be invisible to `userId`, in both directions:
 * people they blocked, and people who blocked them.
 *
 * A block has to be symmetric. If it only worked one way, the blocked person
 * would still see and message the person who blocked them, which is the whole
 * thing the feature exists to stop.
 *
 * Every list endpoint must apply this. Missing one is how a blocked member
 * reappears somewhere unexpected.
 */
async function blockedIdsFor(userId) {
  const blocks = await Block.find({
    $or: [{ blocker: userId }, { blocked: userId }],
  }).select('blocker blocked');

  const ids = new Set();
  for (const block of blocks) {
    const other = String(block.blocker) === String(userId) ? block.blocked : block.blocker;
    ids.add(String(other));
  }

  return [...ids];
}

/** True when either has blocked the other. */
async function isBlockedBetween(idA, idB) {
  const block = await Block.findOne({
    $or: [
      { blocker: idA, blocked: idB },
      { blocker: idB, blocked: idA },
    ],
  });
  return Boolean(block);
}

/**
 * Blocking also tears down whatever relationship existed: an accepted
 * connection is removed and any pending request in either direction is dropped,
 * so neither person is left with a stale row.
 */
async function severConnection(idA, idB) {
  await Connection.deleteMany({
    $or: [
      { requester: idA, recipient: idB },
      { requester: idB, recipient: idA },
    ],
  });
}

module.exports = { blockedIdsFor, isBlockedBetween, severConnection };
