const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['connection_request', 'connection_accepted', 'new_message', 'new_match'],
      required: true,
    },
    // Who caused it. Never the person receiving it.
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    entity: {
      kind: String,
      id: mongoose.Schema.Types.ObjectId,
    },
    readAt: Date,
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });

// Read notifications expire after 90 days rather than growing forever.
notificationSchema.index(
  { readAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60, partialFilterExpression: { readAt: { $type: 'date' } } }
);

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
