const express = require('express');
const router = express.Router();
const {
  getCountries,
  createCountry,
  updateCountry,
  deleteCountry
} = require('../controllers/countryController');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');

router.route('/')
  .get(getCountries)
  .post(protect, admin, createCountry);

router.route('/:id')
  .put(protect, admin, updateCountry)
  .delete(protect, admin, deleteCountry);

module.exports = router;
