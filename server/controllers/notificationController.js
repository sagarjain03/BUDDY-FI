const Notification = require('../models/notificationModel');
const { serialise } = require('../services/notifyService');
const { blockedIdsFor } = require('../utils/blocks');

const PAGE_SIZE = 20;

const fail = (res, err, label) => {
  console.error(`${label} failed:`, err);
  res.status(500).json({ status: 'error', message: 'Something went wrong. Please try again.' });
};

/** GET /api/notifications?before=<iso> */
exports.list = async (req, res) => {
  try {
    const blocked = await blockedIdsFor(req.user._id);

    const query = { user: req.user._id, actor: { $nin: blocked } };
    if (req.query.before) {
      const before = new Date(req.query.before);
      if (!Number.isNaN(before.valueOf())) query.createdAt = { $lt: before };
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(PAGE_SIZE + 1)
      .populate('actor', 'name avatar');

    const hasMore = notifications.length > PAGE_SIZE;
    const page = hasMore ? notifications.slice(0, PAGE_SIZE) : notifications;

    res.status(200).json({
      status: 'success',
      results: page.length,
      hasMore,
      data: { notifications: page.map(serialise) },
    });
  } catch (err) {
    fail(res, err, 'list notifications');
  }
};

/** GET /api/notifications/unread-count */
exports.unreadCount = async (req, res) => {
  try {
    const blocked = await blockedIdsFor(req.user._id);

    const unread = await Notification.countDocuments({
      user: req.user._id,
      actor: { $nin: blocked },
      readAt: { $exists: false },
    });

    res.status(200).json({ status: 'success', data: { unread } });
  } catch (err) {
    fail(res, err, 'notification count');
  }
};

/** PATCH /api/notifications/read — mark everything read. */
exports.readAll = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { user: req.user._id, readAt: { $exists: false } },
      { $set: { readAt: new Date() } }
    );

    res.status(200).json({ status: 'success', data: { updated: result.modifiedCount } });
  } catch (err) {
    fail(res, err, 'mark all read');
  }
};

/** PATCH /api/notifications/:id/read */
exports.readOne = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: { readAt: new Date() } },
      { new: true }
    ).populate('actor', 'name avatar');

    if (!notification) {
      return res.status(404).json({ status: 'error', message: 'Notification not found' });
    }

    res.status(200).json({ status: 'success', data: { notification: serialise(notification) } });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ status: 'error', message: 'Notification not found' });
    }
    fail(res, err, 'mark read');
  }
};
