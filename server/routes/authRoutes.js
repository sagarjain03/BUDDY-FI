const express = require('express');

const { register, login } = require('../controllers/authController');
const { check } = require('express-validator');


const router = express.Router();
const { register, login } = require('../controllers/authController');
const { body } = require('express-validator');


router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 8 or more characters').isLength({ min: 8 }),
    check('age', 'Age is required').not().isEmpty(),
    check('gender', 'Gender is required').not().isEmpty(),
  ],
  register
);

router.post('/login', login);

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
