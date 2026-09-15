const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    // Two entries for now. Keeping it an array leaves room for group chats
    // later without a migration.
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    lastMessageAt: {
      type: Date,
      index: true,
    },
    // Unread count per participant, keyed by user id. Kept denormalised so the
    // conversation list does not have to count messages on every load.
    unread: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

// "My conversations, most recent first" — the only query the list page makes.
conversationSchema.index({ participants: 1, lastMessageAt: -1 });

conversationSchema.methods.isParticipant = function isParticipant(userId) {
  return this.participants.some((id) => String(id._id || id) === String(userId));
};

conversationSchema.methods.otherParticipant = function otherParticipant(userId) {
  return this.participants.find((id) => String(id._id || id) !== String(userId));
};

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
