const express = require('express');
const {
  register,
  login,
  submitHobbies,
  updateLocation,
  getMe,
} = require('../controllers/authController');
const {
  resendVerification,
  verifyEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  logout,
  listSessions,
  endOtherSessions,
  unsubscribeDigest,
} = require('../controllers/accountController');
const {
  updateMe,
  uploadAvatar,
  removeAvatar,
  removeLocation,
} = require('../controllers/profileController');
const { avatarUpload } = require('../middlewares/uploadAvatar');
const { submit: submitAnswers, mine: myAnswers } = require('../controllers/questionController');
const { exportMe, deleteMe } = require('../controllers/accountDataController');
const { protect } = require('../middlewares/authMiddleware');
const { check } = require('express-validator');
const {
  loginLimiter,
  loginByEmailLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  resendVerificationLimiter,
} = require('../middlewares/rateLimit');

const router = express.Router();

router.post(
  '/register',
  registerLimiter,
  [
    check('name', 'Name is required').trim().not().isEmpty(),
    check('email', 'Please include a valid email').isEmail().normalizeEmail(),
    check('password', 'Please enter a password with 8 or more characters').isLength({ min: 8 }),
    check('age', 'Age must be a number between 13 and 120').isInt({ min: 13, max: 120 }),
    check('gender', 'Please choose one of the listed options').isIn([
      'female',
      'male',
      'non-binary',
      'other',
      'prefer-not-to-say',
    ]),
  ],
  register
);

router.post('/login', loginLimiter, loginByEmailLimiter, login);

// Account recovery — all unauthenticated by necessity.
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/unsubscribe/:userId/:token', unsubscribeDigest);

// Everything below requires a valid token.
router.use(protect);

router.get('/me', getMe);
router.patch('/me', updateMe);
router.post('/me/avatar', avatarUpload, uploadAvatar);
router.delete('/me/avatar', removeAvatar);
router.delete('/me/location', removeLocation);
router.get('/me/export', exportMe);
router.delete('/me', deleteMe);
router.post('/verify-email/send', resendVerificationLimiter, resendVerification);
router.patch('/change-password', changePassword);
router.post('/logout', logout);
router.get('/sessions', listSessions);
router.delete('/sessions', endOtherSessions);
// The new, id-based route. /submit-answers stays until the migration is
// verified and the legacy hobbies field is dropped.
router.post('/answers', submitAnswers);
router.get('/answers', myAnswers);
router.post('/submit-answers', submitHobbies);
router.post('/update-location', updateLocation);

module.exports = router;
