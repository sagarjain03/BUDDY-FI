const User = require('../models/userModel');
const Connection = require('../models/connectionModel');
const { blockedIdsFor } = require('../utils/blocks');

/**
 * One person can have several sockets open — two tabs, a phone and a laptop.
 * Counting them is what stops closing one tab from marking someone offline.
 */
const socketsByUser = new Map();

let emitToUser = () => {};

function setEmitter(fn) {
  emitToUser = fn;
}

/** Everyone who is allowed to know this person's presence: their connections. */
async function audienceFor(userId) {
  const [connections, blocked] = await Promise.all([
    Connection.find({
      status: 'accepted',
      $or: [{ requester: userId }, { recipient: userId }],
    }).select('requester recipient'),
    blockedIdsFor(userId),
  ]);

  const blockedSet = new Set(blocked.map(String));

  return connections
    .map((connection) =>
      String(connection.requester) === String(userId)
        ? String(connection.recipient)
        : String(connection.requester)
    )
    .filter((id) => !blockedSet.has(id));
}

async function announce(userId, isOnline, lastSeenAt) {
  const audience = await audienceFor(userId);
  for (const id of audience) {
    emitToUser(id, 'presence:changed', { userId: String(userId), isOnline, lastSeenAt });
  }
}

/** Call when a socket connects. Only the first one flips the flag. */
async function connected(userId) {
  const key = String(userId);
  const existing = socketsByUser.get(key) || new Set();
  const wasOffline = existing.size === 0;
  socketsByUser.set(key, existing);

  if (!wasOffline) return;

  const user = await User.findByIdAndUpdate(userId, { isOnline: true }, { new: true }).select(
    'sharePresence'
  );
  if (user?.sharePresence !== false) await announce(userId, true, null);
}

function addSocket(userId, socketId) {
  const key = String(userId);
  if (!socketsByUser.has(key)) socketsByUser.set(key, new Set());
  socketsByUser.get(key).add(socketId);
}

/** Call when a socket disconnects. Only the last one flips the flag back. */
async function disconnected(userId, socketId) {
  const key = String(userId);
  const sockets = socketsByUser.get(key);
  if (!sockets) return;

  sockets.delete(socketId);
  if (sockets.size > 0) return;

  socketsByUser.delete(key);

  const lastSeenAt = new Date();
  const user = await User.findByIdAndUpdate(
    userId,
    { isOnline: false, lastSeenAt },
    { new: true }
  ).select('sharePresence');

  if (user?.sharePresence !== false) await announce(userId, false, lastSeenAt);
}

/**
 * If the process dies, every user is left marked online forever. Clearing the
 * flag on boot is the cheap fix.
 */
async function resetAll() {
  socketsByUser.clear();
  await User.updateMany({ isOnline: true }, { isOnline: false });
}

const isOnline = (userId) => socketsByUser.has(String(userId));

module.exports = {
  setEmitter,
  connected,
  addSocket,
  disconnected,
  resetAll,
  isOnline,
  audienceFor,
};
