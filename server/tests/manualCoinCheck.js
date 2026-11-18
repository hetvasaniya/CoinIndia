const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
const Coin = require('../models/Coin');
const Category = require('../models/Category');
const Country = require('../models/Country');

async function testManual() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/coinindia';
  await mongoose.connect(mongoUri);
  const cat = await Category.findOne();
  const ctry = await Country.findOne();
  const coin = new Coin({
    name: 'Manual Test Coin ' + Date.now(),
    yearOfIssue: 1940,
    category: cat._id,
    country: ctry._id,
    sellingPrice: 1500,
    quantity: 1,
  });
  const saved = await coin.save();
  console.log('MANUAL COIN SAVED:', saved._id.toString(), 'Slug:', saved.slug);
  await Coin.findByIdAndDelete(saved._id);
  console.log('MANUAL TEST PASSED AND CLEANED UP');
  await mongoose.disconnect();
}

testManual()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
