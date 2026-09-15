const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      // Stores the bcrypt hash, never the plain password.
      type: String,
      required: [true, 'Please provide a password'],
      select: false,
    },
    age: {
      type: Number,
      required: [true, 'Please provide your age'],
      min: [13, 'You must be at least 13'],
      max: [120, 'Please provide a valid age'],
    },
    gender: {
      type: String,
      enum: ['female', 'male', 'non-binary', 'other', 'prefer-not-to-say'],
      required: [true, 'Please provide your gender'],
    },
    avatar: {
      url: String,
      // Provider handle, needed to delete the old file when one is replaced.
      publicId: String,
    },
    bio: {
      type: String,
      maxlength: [240, 'Keep your bio to 240 characters or fewer'],
      trim: true,
    },
    interests: {
      type: [{ type: String, trim: true, maxlength: 30 }],
      validate: {
        validator: (values) => values.length <= 8,
        message: 'You can list up to 8 interests',
      },
      default: undefined,
    },
    // Legacy positional answers (hobby1..hobby7). Kept for one release while
    // the migration to `answers` is verified, then dropped.
    hobbies: {
      type: Map,
      of: String,
      required: false,
    },
    answers: [
      {
        _id: false,
        question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
        value: { type: String, required: true },
        answeredAt: { type: Date, default: Date.now },
      },
    ],
    // GeoJSON, because MongoDB cannot index { longitude, latitude }.
    // coordinates are [longitude, latitude] — that order, always.
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: undefined,
      },
      coordinates: {
        type: [Number],
        default: undefined,
      },
      updatedAt: Date,
    },
    // Off switch: removes the member from proximity results and hides their
    // distance, without deleting the coordinates they already shared.
    shareLocation: {
      type: Boolean,
      default: true,
    },

    // Presence, visible only to connections and only while switched on.
    isOnline: { type: Boolean, default: false },
    lastSeenAt: Date,
    sharePresence: { type: Boolean, default: true },

    // Which emails this member wants. In-app notifications are not optional.
    emailPrefs: {
      digest: { type: Boolean, default: true },
    },

    // Account security. Every token field holds a SHA-256 hash, never the raw
    // value that was emailed, and none of them are selected by default.
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    // Lockout, so an attacker rotating IPs still hits a wall on one account.
    failedLoginCount: { type: Number, default: 0, select: false },
    lockedUntil: { type: Date, select: false },
    verifyTokenHash: { type: String, select: false },
    verifyTokenExpires: { type: Date, select: false },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    passwordChangedAt: { type: Date, select: false },
  },
  { timestamps: true }
);

// Required by $near. Without it the query errors rather than falling back.
userSchema.index({ location: '2dsphere' });

const User = mongoose.model('User', userSchema);

module.exports = User;
