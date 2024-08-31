const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false,
  },
  age: {
    type: Number,
    required: [true, 'Please provide your age'],
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: [true, 'Please provide your gender'],
  },
  hobbies: {
    type: [String], // Change "answers" to "hobbies" and make it an array of strings
    default: [], // Default value is an empty array
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;

