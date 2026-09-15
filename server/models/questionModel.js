const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema(
  {
    // Stable identifier. Answers reference this, never the label.
    value: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    imageUrl: String,
    // Affinity group for partial credit — see utils/compatibility.js.
    group: String,
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    prompt: { type: String, required: true, trim: true },
    // Short label used on cards and profiles.
    label: { type: String, required: true, trim: true },
    helpText: String,
    order: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    options: {
      type: [optionSchema],
      validate: {
        validator: (options) => options.length >= 2,
        message: 'A question needs at least two options',
      },
    },
  },
  { timestamps: true }
);

questionSchema.index({ isActive: 1, order: 1 });

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
