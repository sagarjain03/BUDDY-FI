const User = require('../models/userModel');
const { saveImage, deleteImage, ImageError } = require('../utils/imageStore');
const { hasPoint } = require('../utils/geo');

/**
 * The only fields a member may change about themselves.
 *
 * Never hand `req.body` to an update. That is how a caller grants themselves
 * `isVerified`, `role` or anyone else's email.
 */
const EDITABLE = [
  'name',
  'bio',
  'interests',
  'gender',
  'age',
  'shareLocation',
  'sharePresence',
  'emailPrefs',
];

const avatarOf = (user) => (user.avatar?.url ? user.avatar : undefined);

/** The caller may see their own exact coordinates. Nobody else may. */
const ownLocation = (user) =>
  hasPoint(user.location)
    ? {
        longitude: user.location.coordinates[0],
        latitude: user.location.coordinates[1],
        updatedAt: user.location.updatedAt,
      }
    : undefined;

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  age: user.age,
  gender: user.gender,
  avatar: avatarOf(user),
  bio: user.bio,
  interests: user.interests,
  hobbies: user.hobbies,
  location: ownLocation(user),
  shareLocation: user.shareLocation !== false,
  sharePresence: user.sharePresence !== false,
  emailPrefs: { digest: user.emailPrefs?.digest !== false },
  role: user.role,
  isVerified: user.isVerified,
});

const fail = (res, err, label) => {
  if (err instanceof ImageError) {
    return res.status(err.status).json({ status: 'error', message: err.message });
  }
  if (err.name === 'ValidationError') {
    const first = Object.values(err.errors)[0];
    return res.status(400).json({ status: 'error', message: first?.message || err.message });
  }
  console.error(`${label} failed:`, err);
  return res
    .status(500)
    .json({ status: 'error', message: 'Something went wrong. Please try again.' });
};

/** PATCH /api/auth/me */
exports.updateMe = async (req, res) => {
  try {
    const user = req.user;

    for (const field of EDITABLE) {
      if (!(field in req.body)) continue;

      if (field === 'interests') {
        const raw = Array.isArray(req.body.interests) ? req.body.interests : [];
        user.interests = raw
          .map((value) => String(value).trim())
          .filter(Boolean)
          .slice(0, 8);
        continue;
      }

      if (field === 'shareLocation' || field === 'sharePresence') {
        user[field] = Boolean(req.body[field]);
        continue;
      }

      if (field === 'emailPrefs') {
        // Only the keys we know about, so this cannot become a dumping ground.
        user.emailPrefs = { digest: Boolean(req.body.emailPrefs?.digest) };
        continue;
      }

      if (field === 'age') {
        const age = Number(req.body.age);
        if (!Number.isFinite(age)) {
          return res.status(400).json({ status: 'error', message: 'Age must be a number' });
        }
        user.age = age;
        continue;
      }

      user[field] = typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field];
    }

    await user.save({ validateModifiedOnly: true });

    res.status(200).json({ status: 'success', data: { user: sanitizeUser(user) } });
  } catch (err) {
    fail(res, err, 'updateMe');
  }
};

/** DELETE /api/auth/me/location — forget the stored position entirely. */
exports.removeLocation = async (req, res) => {
  try {
    await User.updateOne({ _id: req.user._id }, { $unset: { location: 1 } });
    req.user.location = undefined;

    res.status(200).json({ status: 'success', message: 'Location cleared' });
  } catch (err) {
    fail(res, err, 'removeLocation');
  }
};

/** POST /api/auth/me/avatar — multipart, field name "avatar". */
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ status: 'error', message: 'No image was uploaded' });
    }

    const stored = await saveImage(req.file.buffer);
    const previous = req.user.avatar?.publicId;

    req.user.avatar = { url: stored.url, publicId: stored.publicId };
    await req.user.save({ validateModifiedOnly: true });

    // Only after the new one is safely recorded.
    if (previous && previous !== stored.publicId) {
      await deleteImage(previous).catch(() => {});
    }

    res.status(200).json({ status: 'success', data: { avatar: req.user.avatar } });
  } catch (err) {
    fail(res, err, 'uploadAvatar');
  }
};

/** DELETE /api/auth/me/avatar — back to the initials avatar. */
exports.removeAvatar = async (req, res) => {
  try {
    const previous = req.user.avatar?.publicId;

    await User.updateOne({ _id: req.user._id }, { $unset: { avatar: 1 } });
    req.user.avatar = undefined;

    if (previous) await deleteImage(previous).catch(() => {});

    res.status(200).json({ status: 'success', message: 'Photo removed' });
  } catch (err) {
    fail(res, err, 'removeAvatar');
  }
};

exports.EDITABLE = EDITABLE;
exports.sanitizeUser = sanitizeUser;
