const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'withdrawn'],
      default: 'pending',
      index: true,
    },
    respondedAt: Date,
  },
  { timestamps: true }
);

// One record per ordered pair. This stops A->B twice; the controller also
// checks the reverse direction so B->A cannot create a second request.
connectionSchema.index({ requester: 1, recipient: 1 }, { unique: true });

// Fast lookup of "everything involving this user", used by the buddies list.
connectionSchema.index({ status: 1, requester: 1, recipient: 1 });

connectionSchema.pre('validate', function guardSelfConnection(next) {
  if (this.requester && this.recipient && this.requester.equals(this.recipient)) {
    return next(new Error('You cannot connect with yourself'));
  }
  next();
});

/** The other participant, from `userId`'s point of view. */
connectionSchema.methods.otherParty = function otherParty(userId) {
  return this.requester.equals(userId) ? this.recipient : this.requester;
};

const Connection = mongoose.model('Connection', connectionSchema);

module.exports = Connection;
