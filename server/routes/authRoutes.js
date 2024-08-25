const express = require('express');
const { check } = require('express-validator');
const authController = require('../controllers/authController');

const router = express.Router();

router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters long').isLength({ min: 6 }),
    check('confirmPassword', 'Please confirm your password').not().isEmpty(),
    check('age', 'Age is required').isInt({ min: 0 }),
  ],
  authController.register
);

router.post('/login', authController.login);

module.exports = router;
