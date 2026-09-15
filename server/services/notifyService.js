const Notification = require('../models/notificationModel');

/**
 * One place that creates notifications, so every producer behaves the same and
 * the socket push cannot be forgotten.
 *
 * `emitToUser` is injected at startup to avoid a require cycle with the socket
 * layer, which itself pulls in the message service.
 */
let emitToUser = () => {};

function setEmitter(fn) {
  emitToUser = fn;
}

/**
 * Creates a notification and pushes it live.
 *
 * Never notifies someone about their own action, and collapses repeated
 * `new_message` for the same conversation into the existing unread row — one
 * badge per conversation, not one per message.
 */
async function notify({ user, type, actor, entity }) {
  if (!user) return null;
  if (actor && String(actor) === String(user)) return null;

  if (type === 'new_message' && entity?.id) {
    const existing = await Notification.findOne({
      user,
      type: 'new_message',
      'entity.id': entity.id,
      readAt: { $exists: false },
    });

    if (existing) {
      // Bump it to the top rather than stacking another row.
      existing.actor = actor;
      existing.set('createdAt', new Date());
      await existing.save();
      return existing;
    }
  }

  const notification = await Notification.create({ user, type, actor, entity });
  await notification.populate('actor', 'name avatar');

  emitToUser(String(user), 'notification:new', serialise(notification));

  return notification;
}

const serialise = (notification) => ({
  _id: notification._id,
  type: notification.type,
  actor: notification.actor
    ? {
        _id: notification.actor._id,
        name: notification.actor.name,
        avatar: notification.actor.avatar?.url ? notification.actor.avatar : undefined,
      }
    : null,
  entity: notification.entity,
  readAt: notification.readAt,
  createdAt: notification.createdAt,
});

module.exports = { notify, setEmitter, serialise };
