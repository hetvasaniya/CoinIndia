const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/coinindia';
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.error('⚠️ Please ensure MongoDB is installed and running locally (127.0.0.1:27017) or provide a valid MONGO_URI / MONGODB_URI in server/.env');
    process.exit(1);
  }
};

module.exports = connectDB;
