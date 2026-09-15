const mongoose = require('mongoose');
const Block = require('../models/blockModel');
const Report = require('../models/reportModel');
const User = require('../models/userModel');
const { severConnection } = require('../utils/blocks');

const PUBLIC_FIELDS = 'name age gender avatar';

const fail = (res, err, label) => {
  console.error(`${label} failed:`, err);
  res.status(500).json({ status: 'error', message: 'Something went wrong. Please try again.' });
};

/* -- blocks ----------------------------------------------------------- */

/** POST /api/blocks  { userId, reason? } */
exports.block = async (req, res) => {
  try {
    const { userId, reason } = req.body;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ status: 'error', message: 'A valid userId is required' });
    }
    if (String(userId) === String(req.user._id)) {
      return res.status(400).json({ status: 'error', message: 'You cannot block yourself' });
    }

    const target = await User.findById(userId).select('_id name');
    if (!target) {
      return res.status(404).json({ status: 'error', message: 'Member not found' });
    }

    await Block.updateOne(
      { blocker: req.user._id, blocked: target._id },
      { $setOnInsert: { reason: reason?.slice(0, 500) } },
      { upsert: true }
    );

    // Blocking ends the relationship, it does not just hide it.
    await severConnection(req.user._id, target._id);

    res.status(201).json({
      status: 'success',
      message: `You have blocked ${target.name}. They can no longer see or contact you.`,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(200).json({ status: 'success', message: 'Already blocked' });
    }
    fail(res, err, 'block');
  }
};

/** GET /api/blocks */
exports.listBlocks = async (req, res) => {
  try {
    const blocks = await Block.find({ blocker: req.user._id })
      .sort({ createdAt: -1 })
      .populate('blocked', PUBLIC_FIELDS);

    res.status(200).json({
      status: 'success',
      results: blocks.length,
      data: {
        blocks: blocks
          .filter((entry) => entry.blocked)
          .map((entry) => ({
            _id: entry._id,
            user: {
              _id: entry.blocked._id,
              name: entry.blocked.name,
              age: entry.blocked.age,
              gender: entry.blocked.gender,
              avatar: entry.blocked.avatar?.url ? entry.blocked.avatar : undefined,
            },
            blockedAt: entry.createdAt,
          })),
      },
    });
  } catch (err) {
    fail(res, err, 'listBlocks');
  }
};

/** DELETE /api/blocks/:userId — unblock. The old connection does not return. */
exports.unblock = async (req, res) => {
  try {
    const result = await Block.deleteOne({
      blocker: req.user._id,
      blocked: req.params.userId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ status: 'error', message: 'You have not blocked them' });
    }

    res.status(200).json({ status: 'success', message: 'Unblocked' });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ status: 'error', message: 'Member not found' });
    }
    fail(res, err, 'unblock');
  }
};

/* -- reports ---------------------------------------------------------- */

/** POST /api/reports  { userId, category, details?, block? } */
exports.report = async (req, res) => {
  try {
    const { userId, category, details, context, block: alsoBlock } = req.body;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ status: 'error', message: 'A valid userId is required' });
    }
    if (String(userId) === String(req.user._id)) {
      return res.status(400).json({ status: 'error', message: 'You cannot report yourself' });
    }

    const target = await User.findById(userId).select('_id name');
    if (!target) {
      return res.status(404).json({ status: 'error', message: 'Member not found' });
    }

    await Report.create({
      reporter: req.user._id,
      reported: target._id,
      category,
      details,
      context: {
        conversationId: mongoose.isValidObjectId(context?.conversationId)
          ? context.conversationId
          : undefined,
        messageId: mongoose.isValidObjectId(context?.messageId) ? context.messageId : undefined,
      },
    });

    // "Block and report" is one action to the person using it.
    if (alsoBlock) {
      await Block.updateOne(
        { blocker: req.user._id, blocked: target._id },
        { $setOnInsert: { reason: `Reported: ${category}` } },
        { upsert: true }
      ).catch(() => {});
      await severConnection(req.user._id, target._id);
    }

    res.status(201).json({
      status: 'success',
      message: alsoBlock
        ? 'Thanks. We will review this, and they can no longer contact you.'
        : 'Thanks. We will review this.',
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const first = Object.values(err.errors)[0];
      return res.status(400).json({ status: 'error', message: first?.message || err.message });
    }
    fail(res, err, 'report');
  }
};

/* -- admin ------------------------------------------------------------ */

/** GET /api/admin/reports?status=open */
exports.listReports = async (req, res) => {
  try {
    const query = {};
    if (['open', 'reviewing', 'actioned', 'dismissed'].includes(req.query.status)) {
      query.status = req.query.status;
    }

    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('reporter reported reviewedBy', 'name email');

    res.status(200).json({
      status: 'success',
      results: reports.length,
      data: { reports },
    });
  } catch (err) {
    fail(res, err, 'listReports');
  }
};

/** PATCH /api/admin/reports/:id  { status, reviewNotes } */
exports.updateReport = async (req, res) => {
  try {
    const { status, reviewNotes } = req.body;

    if (!['open', 'reviewing', 'actioned', 'dismissed'].includes(status)) {
      return res.status(400).json({ status: 'error', message: 'Unknown status' });
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status, reviewNotes, reviewedBy: req.user._id },
      { new: true }
    ).populate('reporter reported reviewedBy', 'name email');

    if (!report) {
      return res.status(404).json({ status: 'error', message: 'Report not found' });
    }

    res.status(200).json({ status: 'success', data: { report } });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ status: 'error', message: 'Report not found' });
    }
    fail(res, err, 'updateReport');
  }
};
