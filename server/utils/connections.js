const Connection = require('../models/connectionModel');

/**
 * Finds the connection between two users regardless of who asked whom.
 * A pair can only ever have one record, so this is the single lookup every
 * caller should use.
 */
async function findBetween(idA, idB) {
  return Connection.findOne({
    $or: [
      { requester: idA, recipient: idB },
      { requester: idB, recipient: idA },
    ],
  });
}

/** True only when the two users have an accepted connection. */
async function areConnected(idA, idB) {
  const connection = await findBetween(idA, idB);
  return connection?.status === 'accepted';
}

/**
 * Describes a connection from `viewerId`'s point of view, in the shape the
 * client needs to render the right button without a second request.
 *
 *   none        no record, or a previously declined/withdrawn one
 *   pending_out viewer asked, waiting on them
 *   pending_in  they asked, waiting on viewer
 *   accepted    already buddies
 */
function describe(connection, viewerId) {
  if (!connection || connection.status === 'declined' || connection.status === 'withdrawn') {
    return { status: 'none', id: connection ? String(connection._id) : null };
  }

  if (connection.status === 'accepted') {
    return { status: 'accepted', id: String(connection._id) };
  }

  const iAsked = connection.requester.equals(viewerId);
  return { status: iAsked ? 'pending_out' : 'pending_in', id: String(connection._id) };
}

/**
 * Builds a Map of otherUserId -> describe() for every connection involving the
 * viewer, so a list of matches can be annotated with one query instead of one
 * per card.
 */
async function statusMapFor(viewerId) {
  const connections = await Connection.find({
    $or: [{ requester: viewerId }, { recipient: viewerId }],
  });

  const map = new Map();
  for (const connection of connections) {
    map.set(String(connection.otherParty(viewerId)), describe(connection, viewerId));
  }
  return map;
}

module.exports = { findBetween, areConnected, describe, statusMapFor };
