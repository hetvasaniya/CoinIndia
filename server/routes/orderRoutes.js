const express = require('express');
const router = express.Router();
const {
  createOrder,
  getUserOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');

router.route('/create')
  .post(protect, createOrder);

router.route('/')
  .get(protect, getUserOrders)
  .post(protect, createOrder);

router.route('/:id')
  .get(protect, getOrderById);

// Admin routes for orders handled in admin controller, but can also be here
// Will put them here for separation
router.route('/admin/all')
  .get(protect, admin, getAllOrders);

router.route('/admin/:id/status')
  .put(protect, admin, updateOrderStatus);

module.exports = router;
