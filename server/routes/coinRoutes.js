const express = require('express');
const router = express.Router();
const {
  getCoins,
  getFeaturedCoins,
  getCoinBySlug,
  getRelatedCoins
} = require('../controllers/coinController');

router.get('/', getCoins);
router.get('/featured', getFeaturedCoins);
router.get('/:identifier/related', getRelatedCoins);
router.get('/:slug', getCoinBySlug);

module.exports = router;
