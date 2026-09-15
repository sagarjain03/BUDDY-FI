const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Roughly where this session came from, so a member can recognise it in
    // the list. Never used for anything but display.
    userAgent: { type: String, maxlength: 300 },
    ip: { type: String, maxlength: 64 },
    lastSeenAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Expired sessions clean themselves up.
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
