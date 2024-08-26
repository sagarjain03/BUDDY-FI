const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { body } = require('express-validator');

// Register route
router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password should be at least 6 characters long'),
  body('confirmPassword').notEmpty().withMessage('Confirm your password'),
  body('age').isNumeric().withMessage('Age should be a number'),
], register);

// Login route
router.post('/login', [
  body('email').isEmail().withMessage('Enter a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
], login);

module.exports = router;
