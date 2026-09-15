const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const signToken = require('../utils/signToken');
const { sessionContext } = require('../utils/signToken');
const { deliverVerification } = require('./accountController');
const { toPoint, hasPoint, isValidLongitude, isValidLatitude } = require('../utils/geo');

const MAX_FAILED_LOGINS = 8;
const LOCKOUT_MS = 15 * 60 * 1000;

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
  avatar: user.avatar?.url ? user.avatar : undefined,
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

// Register user
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, confirmPassword, age, gender } = req.body;

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const user = await User.create({ name, email, password: hashedPassword, age, gender });

    await deliverVerification(user).catch((mailError) =>
      console.error('verification email failed for', user.email, mailError.message)
    );

    res.status(201).json({
      status: 'success',
      token: await signToken(user._id, sessionContext(req)),
      data: {
        user: sanitizeUser(user),
      },
    });
  } catch (err) {
    // Duplicate key from the unique index on email.
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ status: 'error', message: err.message });
    }
    console.error('register failed:', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong. Please try again.',
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find the user and include the password field
    const user = await User.findOne({ email }).select(
      '+password +failedLoginCount +lockedUntil'
    );

    if (user?.lockedUntil && user.lockedUntil > new Date()) {
      const minutes = Math.ceil((user.lockedUntil - Date.now()) / 60000);
      return res.status(429).json({
        message:
          'Too many failed attempts. Try again in ' + minutes + (minutes === 1 ? ' minute.' : ' minutes.'),
      });
    }

    if (!user || !(await bcrypt.compare(password, user.password))) {
      if (user) {
        user.failedLoginCount = (user.failedLoginCount || 0) + 1;
        if (user.failedLoginCount >= MAX_FAILED_LOGINS) {
          user.lockedUntil = new Date(Date.now() + LOCKOUT_MS);
          user.failedLoginCount = 0;
        }
        await user.save({ validateModifiedOnly: true });
      }
      // Same message either way, so this cannot be used to probe for accounts.
      return res.status(401).json({ message: 'Incorrect email or password' });
    }

    if (user.failedLoginCount || user.lockedUntil) {
      user.failedLoginCount = 0;
      user.lockedUntil = undefined;
      await user.save({ validateModifiedOnly: true });
    }

    res.status(200).json({
      status: 'success',
      token: await signToken(user._id, sessionContext(req)),
      data: {
        user: sanitizeUser(user),
      },
    });
  } catch (err) {
    console.error('login failed:', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong. Please try again.',
    });
  }
};

// Submit hobbies for the logged-in user
exports.submitHobbies = async (req, res) => {
  try {
    const { hobbies } = req.body;

    if (!hobbies || typeof hobbies !== 'object' || Array.isArray(hobbies)) {
      return res.status(400).json({ message: 'hobbies must be an object of answers' });
    }

    const user = req.user;
    user.hobbies = hobbies;
    // password is not selected on this doc, so only validate what we changed
    await user.save({ validateModifiedOnly: true });

    res.status(200).json({
      status: 'success',
      message: 'Hobbies updated successfully',
      data: {
        hobbies: user.hobbies,
      },
    });
  } catch (err) {
    console.error('submitHobbies failed:', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong. Please try again.',
    });
  }
};

// Update the logged-in user's location
exports.updateLocation = async (req, res) => {
  try {
    const longitude = Number(req.body.longitude);
    const latitude = Number(req.body.latitude);

    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
      return res.status(400).json({ message: 'longitude and latitude must be numbers' });
    }
    if (!isValidLongitude(longitude) || !isValidLatitude(latitude)) {
      return res.status(400).json({ message: 'longitude or latitude is out of range' });
    }

    const user = req.user;
    user.location = toPoint(longitude, latitude);
    // password is not selected on this doc, so only validate what we changed
    await user.save({ validateModifiedOnly: true });

    res.status(200).json({
      status: 'success',
      message: 'Location updated successfully',
      data: {
        // Only ever the caller's own coordinates.
        location: {
          longitude,
          latitude,
          updatedAt: user.location.updatedAt,
        },
        shareLocation: user.shareLocation !== false,
      },
    });
  } catch (err) {
    console.error('updateLocation failed:', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong. Please try again.',
    });
  }
};

// Return the logged-in user's own profile
exports.getMe = async (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: sanitizeUser(req.user),
    },
  });
};
