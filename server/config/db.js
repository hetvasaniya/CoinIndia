const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/coinindia');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.error('⚠️ Please ensure MongoDB is installed and running locally (127.0.0.1:27017) or provide a valid MONGO_URI in server/.env');
    process.exit(1);
  }
};

module.exports = connectDB;
