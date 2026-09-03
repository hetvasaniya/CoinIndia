const express = require('express');
const router = express.Router();
const {
  createInquiry,
  getInquiries,
  updateInquiry,
  deleteInquiry
} = require('../controllers/supportController');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');

// Optional auth helper to attach user if logged in
const optionalAuth = (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return protect(req, res, next);
  }
  next();
};

// Client support inquiry route
router.post('/', optionalAuth, createInquiry);

// Admin support inquiry routes
router.get('/admin', protect, admin, getInquiries);
router.put('/admin/:id', protect, admin, updateInquiry);
router.delete('/admin/:id', protect, admin, deleteInquiry);

module.exports = router;
