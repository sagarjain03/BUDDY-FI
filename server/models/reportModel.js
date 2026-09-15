const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reported: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['harassment', 'spam', 'fake-profile', 'inappropriate-content', 'other'],
      required: true,
    },
    details: { type: String, maxlength: 1000, trim: true },
    context: {
      conversationId: mongoose.Schema.Types.ObjectId,
      messageId: mongoose.Schema.Types.ObjectId,
    },
    status: {
      type: String,
      enum: ['open', 'reviewing', 'actioned', 'dismissed'],
      default: 'open',
      index: true,
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewNotes: { type: String, maxlength: 2000 },
  },
  { timestamps: true }
);

reportSchema.index({ status: 1, createdAt: -1 });

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
