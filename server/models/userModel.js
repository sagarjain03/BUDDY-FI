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
    type: Map,
    of: String, 
    required: false,
  },
  location: {
    longitude: {
      type: Number,
      required: false,
    },
    latitude: {
      type: Number,
      required: false,
    },
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
