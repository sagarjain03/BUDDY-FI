const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set. Copy .env.example to .env and fill it in.');
    process.exit(1);
  }

  try {
    // If MONGO_URI has no database in its path, Mongoose silently uses "test",
    // which on a shared cluster can collide with another project's collections.
    // Set MONGO_DB_NAME to pin this app to its own database.
    const options = process.env.MONGO_DB_NAME ? { dbName: process.env.MONGO_DB_NAME } : {};
    const conn = await mongoose.connect(process.env.MONGO_URI, options);
    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
