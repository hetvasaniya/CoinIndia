const express = require('express');
const router = express.Router();
const {
  verifyPayment,
  handleWebhook,
  getPaymentHistory,
  demoCheckout
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/verify', protect, verifyPayment);
router.post('/demo-checkout', protect, demoCheckout);
router.post('/webhook', handleWebhook);
router.get('/history', protect, getPaymentHistory);

module.exports = router;
