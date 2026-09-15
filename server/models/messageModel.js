const mongoose = require('mongoose');

const MAX_BODY = 2000;

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    body: {
      type: String,
      required: [true, 'A message cannot be empty'],
      trim: true,
      maxlength: [MAX_BODY, `A message cannot be longer than ${MAX_BODY} characters`],
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

// History is paged newest-first with a `before` cursor.
messageSchema.index({ conversation: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
module.exports.MAX_BODY = MAX_BODY;
