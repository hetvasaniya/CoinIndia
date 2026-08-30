const Razorpay = require('razorpay');
const dotenv = require('dotenv');

dotenv.config();

const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy_key_id';
const key_secret = process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret';

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn('⚠️ Razorpay credentials missing in environment variables. Using placeholder keys for development.');
}

const razorpay = new Razorpay({
  key_id,
  key_secret,
});

module.exports = razorpay;

