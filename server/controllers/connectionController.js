const mongoose = require('mongoose');
const Connection = require('../models/connectionModel');
const User = require('../models/userModel');
const { findBetween, describe } = require('../utils/connections');
const { compareUsers, hasCompletedQuiz } = require('../utils/compatibility');
const { getQuestions } = require('../services/questionService');
const { blockedIdsFor, isBlockedBetween } = require('../utils/blocks');
const { notify } = require('../services/notifyService');

// Never expose email addresses through the connection endpoints either.
const PUBLIC_FIELDS =
  'name age gender hobbies answers avatar bio interests createdAt isOnline lastSeenAt sharePresence';

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  age: user.age,
  gender: user.gender,
  avatar: user.avatar?.url ? user.avatar : undefined,
  bio: user.bio,
  interests: user.interests,
  hobbies: user.hobbies,
  ...(user.sharePresence === false
    ? {}
    : { isOnline: Boolean(user.isOnline), lastSeenAt: user.lastSeenAt }),
});

/** Adds the compatibility percentage the viewer sees on every person card. */
const withScore = (viewer, other, questions) => {
  if (!hasCompletedQuiz(viewer, questions) || !hasCompletedQuiz(other, questions)) {
    return { user: publicUser(other), percent: null, shared: [] };
  }
  const { percent, shared } = compareUsers(viewer, other, questions);
  return { user: publicUser(other), percent, shared };
};

/**
 * POST /api/connections   { userId }
 *
 * Sends a request. If the other person already asked, this accepts theirs
 * instead of creating a mirror record. A previously declined or withdrawn
 * record is reopened rather than duplicated.
 */
exports.send = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ status: 'error', message: 'A valid userId is required' });
    }
    if (String(userId) === String(req.user._id)) {
      return res.status(400).json({ status: 'error', message: 'You cannot connect with yourself' });
    }

    const target = await User.findById(userId).select(PUBLIC_FIELDS);
    if (!target) {
      return res.status(404).json({ status: 'error', message: 'Member not found' });
    }

    // Reads as "not found" rather than "you are blocked", which would tell the
    // blocked person exactly what happened.
    if (await isBlockedBetween(req.user._id, target._id)) {
      return res.status(404).json({ status: 'error', message: 'Member not found' });
    }

    const existing = await findBetween(req.user._id, userId);

    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(409).json({ status: 'error', message: 'You are already connected' });
      }

      if (existing.status === 'pending') {
        // They asked first — treat this as accepting, not as a second request.
        if (existing.recipient.equals(req.user._id)) {
          existing.status = 'accepted';
          existing.respondedAt = new Date();
          await existing.save();

          return res.status(200).json({
            status: 'success',
            message: `You and ${target.name} are now connected`,
            data: { connection: describe(existing, req.user._id) },
          });
        }

        return res.status(409).json({ status: 'error', message: 'Request already sent' });
      }

      // declined or withdrawn — reopen the same record, in the new direction.
      existing.requester = req.user._id;
      existing.recipient = target._id;
      existing.status = 'pending';
      existing.respondedAt = undefined;
      await existing.save();

      return res.status(201).json({
        status: 'success',
        message: 'Request sent',
        data: { connection: describe(existing, req.user._id) },
      });
    }

    const connection = await Connection.create({
      requester: req.user._id,
      recipient: target._id,
    });

    await notify({
      user: target._id,
      type: 'connection_request',
      actor: req.user._id,
      entity: { kind: 'connection', id: connection._id },
    }).catch(() => {});

    res.status(201).json({
      status: 'success',
      message: 'Request sent',
      data: { connection: describe(connection, req.user._id) },
    });
  } catch (err) {
    // Two simultaneous requests can both pass the check above; the unique index
    // catches the loser.
    if (err.code === 11000) {
      return res.status(409).json({ status: 'error', message: 'Request already sent' });
    }
    console.error('connection send failed:', err);
    res.status(500).json({ status: 'error', message: 'Something went wrong. Please try again.' });
  }
};

/** GET /api/connections — accepted connections, newest first. */
exports.listAccepted = async (req, res) => {
  try {
    const [blocked, questions] = await Promise.all([blockedIdsFor(req.user._id), getQuestions()]);

    const connections = await Connection.find({
      status: 'accepted',
      requester: { $nin: blocked },
      recipient: { $nin: blocked },
      $or: [{ requester: req.user._id }, { recipient: req.user._id }],
    })
      .sort({ respondedAt: -1, updatedAt: -1 })
      .populate('requester recipient', PUBLIC_FIELDS);

    const buddies = connections
      .map((connection) => {
        const other = connection.requester._id.equals(req.user._id)
          ? connection.recipient
          : connection.requester;

        return {
          connectionId: connection._id,
          connectedAt: connection.respondedAt || connection.updatedAt,
          ...withScore(req.user, other, questions),
        };
      })
      .filter((entry) => entry.user);

    res.status(200).json({
      status: 'success',
      results: buddies.length,
      data: { buddies },
    });
  } catch (err) {
    console.error('listAccepted failed:', err);
    res.status(500).json({ status: 'error', message: 'Something went wrong. Please try again.' });
  }
};

/** GET /api/connections/pending — requests waiting on the caller. */
exports.listIncoming = async (req, res) => {
  try {
    const [blocked, questions] = await Promise.all([blockedIdsFor(req.user._id), getQuestions()]);

    const connections = await Connection.find({
      status: 'pending',
      recipient: req.user._id,
      requester: { $nin: blocked },
    })
      .sort({ createdAt: -1 })
      .populate('requester', PUBLIC_FIELDS);

    const requests = connections
      .filter((connection) => connection.requester)
      .map((connection) => ({
        connectionId: connection._id,
        requestedAt: connection.createdAt,
        ...withScore(req.user, connection.requester, questions),
      }));

    res.status(200).json({ status: 'success', results: requests.length, data: { requests } });
  } catch (err) {
    console.error('listIncoming failed:', err);
    res.status(500).json({ status: 'error', message: 'Something went wrong. Please try again.' });
  }
};

/** GET /api/connections/sent — the caller's outgoing pending requests. */
exports.listOutgoing = async (req, res) => {
  try {
    const [blocked, questions] = await Promise.all([blockedIdsFor(req.user._id), getQuestions()]);

    const connections = await Connection.find({
      status: 'pending',
      requester: req.user._id,
      recipient: { $nin: blocked },
    })
      .sort({ createdAt: -1 })
      .populate('recipient', PUBLIC_FIELDS);

    const requests = connections
      .filter((connection) => connection.recipient)
      .map((connection) => ({
        connectionId: connection._id,
        requestedAt: connection.createdAt,
        ...withScore(req.user, connection.recipient, questions),
      }));

    res.status(200).json({ status: 'success', results: requests.length, data: { requests } });
  } catch (err) {
    console.error('listOutgoing failed:', err);
    res.status(500).json({ status: 'error', message: 'Something went wrong. Please try again.' });
  }
};

/**
 * Shared by accept and decline. Only the recipient of a pending request may
 * respond to it — checked here, not in the UI.
 */
const respond = (nextStatus) => async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.id);

    if (!connection) {
      return res.status(404).json({ status: 'error', message: 'Request not found' });
    }
    if (!connection.recipient.equals(req.user._id)) {
      return res
        .status(403)
        .json({ status: 'error', message: 'Only the person who received this request can respond' });
    }
    if (connection.status !== 'pending') {
      return res
        .status(409)
        .json({ status: 'error', message: `This request is already ${connection.status}` });
    }

    connection.status = nextStatus;
    connection.respondedAt = new Date();
    await connection.save();

    if (nextStatus === 'accepted') {
      await notify({
        user: connection.requester,
        type: 'connection_accepted',
        actor: req.user._id,
        entity: { kind: 'connection', id: connection._id },
      }).catch(() => {});
    }

    res.status(200).json({
      status: 'success',
      message: nextStatus === 'accepted' ? 'You are now connected' : 'Request declined',
      data: { connection: describe(connection, req.user._id) },
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ status: 'error', message: 'Request not found' });
    }
    console.error('connection respond failed:', err);
    res.status(500).json({ status: 'error', message: 'Something went wrong. Please try again.' });
  }
};

exports.accept = respond('accepted');
exports.decline = respond('declined');

/**
 * DELETE /api/connections/:id
 * Withdraws a pending request (requester only) or removes an accepted
 * connection (either side).
 */
exports.remove = async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.id);

    if (!connection) {
      return res.status(404).json({ status: 'error', message: 'Connection not found' });
    }

    const isRequester = connection.requester.equals(req.user._id);
    const isRecipient = connection.recipient.equals(req.user._id);

    if (!isRequester && !isRecipient) {
      return res.status(403).json({ status: 'error', message: 'That is not your connection' });
    }

    if (connection.status === 'pending') {
      if (!isRequester) {
        return res.status(403).json({
          status: 'error',
          message: 'Decline the request instead of withdrawing it',
        });
      }
      connection.status = 'withdrawn';
      connection.respondedAt = new Date();
      await connection.save();

      return res.status(200).json({ status: 'success', message: 'Request withdrawn' });
    }

    // Accepted, declined or already withdrawn: drop the record entirely so the
    // pair can start fresh later.
    await connection.deleteOne();
    res.status(200).json({ status: 'success', message: 'Connection removed' });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ status: 'error', message: 'Connection not found' });
    }
    console.error('connection remove failed:', err);
    res.status(500).json({ status: 'error', message: 'Something went wrong. Please try again.' });
  }
};

/** GET /api/connections/counts — small payload for the navbar badge. */
exports.counts = async (req, res) => {
  try {
    const blocked = await blockedIdsFor(req.user._id);

    const [incoming, buddies] = await Promise.all([
      Connection.countDocuments({
        status: 'pending',
        recipient: req.user._id,
        requester: { $nin: blocked },
      }),
      Connection.countDocuments({
        status: 'accepted',
        requester: { $nin: blocked },
        recipient: { $nin: blocked },
        $or: [{ requester: req.user._id }, { recipient: req.user._id }],
      }),
    ]);

    res.status(200).json({ status: 'success', data: { incoming, buddies } });
  } catch (err) {
    console.error('connection counts failed:', err);
    res.status(500).json({ status: 'error', message: 'Something went wrong. Please try again.' });
  }
};
