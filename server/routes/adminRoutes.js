const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getUsers,
  updateUser,
  getInventory
} = require('../controllers/adminController');
const {
  createCoin,
  updateCoin,
  deleteCoin,
  updateQuantity,
  toggleFeatured,
  getAdminCoins,
  getCoinById
} = require('../controllers/coinController');
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');
const {
  getCountries,
  createCountry,
  updateCountry,
  deleteCountry
} = require('../controllers/countryController');
const {
  getMints,
  createMint,
  updateMint,
  deleteMint
} = require('../controllers/mintController');
const { getPaymentHistory } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');
const upload = require('../middleware/upload');
const { 
  getAllOrders, 
  getOrderById,
  updateOrderStatus, 
  cancelOrder, 
  processRefund, 
  getOrderStats 
} = require('../controllers/orderController');

router.use(protect, admin);

router.get('/dashboard', getDashboardStats);
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.get('/inventory', getInventory);

// Admin Category Routes
router.route('/categories')
  .get(getCategories)
  .post(createCategory);

router.route('/categories/:id')
  .put(updateCategory)
  .delete(deleteCategory);

// Admin Country Routes
router.route('/countries')
  .get(getCountries)
  .post(createCountry);

router.route('/countries/:id')
  .put(updateCountry)
  .delete(deleteCountry);

// Admin Mint Routes
router.route('/mints')
  .get(getMints)
  .post(createMint);

router.route('/mints/:id')
  .put(updateMint)
  .delete(deleteMint);

// Admin Coin Routes
router.route('/coins')
  .get(getAdminCoins)
  .post(upload.array('images', 5), createCoin);

router.route('/coins/:id')
  .get(getCoinById)
  .put(upload.array('images', 5), updateCoin)
  .delete(deleteCoin);

router.put('/coins/:id/quantity', updateQuantity);
router.put('/coins/:id/featured', toggleFeatured);

// Admin Order & Payment Routes
router.get('/orders/stats', getOrderStats);
router.get('/orders', getAllOrders);
router.get('/orders/:id', getOrderById);
router.put('/orders/:id/status', updateOrderStatus);
router.put('/orders/:id/cancel', cancelOrder);
router.put('/orders/:id/refund', processRefund);
router.get('/payments', getPaymentHistory);

module.exports = router;

