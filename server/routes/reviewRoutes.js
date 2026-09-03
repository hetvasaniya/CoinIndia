const express = require('express');
const router = express.Router();
const {
  getReviews,
  createReview,
  markHelpful
} = require('../controllers/reviewController');

router.route('/')
  .get(getReviews)
  .post(createReview);

router.route('/:id/helpful')
  .post(markHelpful);

module.exports = router;
