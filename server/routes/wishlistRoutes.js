const express = require('express');
const router = express.Router();
const {
  getWishlist,
  toggleWishlist,
  removeFromWishlist
} = require('../controllers/wishlistController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getWishlist);

router.post('/toggle/:coinId', toggleWishlist);
router.post('/:coinId', toggleWishlist);
router.delete('/:coinId', removeFromWishlist);

module.exports = router;
