const express = require('express');
const router = express.Router();
const {
  getPublicSettings,
  getAdminSettings,
  updateSettings,
  uploadPrivacyPolicy,
  deletePrivacyPolicy
} = require('../controllers/settingsController');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');
const pdfUpload = require('../middleware/pdfUpload');

// Public settings route
router.get('/public', getPublicSettings);

// Protected Admin settings routes
router.get('/admin', protect, admin, getAdminSettings);
router.put('/admin', protect, admin, updateSettings);

// Privacy Policy PDF upload route
router.post('/admin/privacy-policy', protect, admin, pdfUpload.single('file'), (req, res, next) => {
  if (req.file) {
    req.file.path = `/uploads/${req.file.filename}`;
  }
  next();
}, uploadPrivacyPolicy);

router.delete('/admin/privacy-policy', protect, admin, deletePrivacyPolicy);

module.exports = router;
