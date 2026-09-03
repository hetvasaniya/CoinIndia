const Review = require('../models/Review');

// @desc    Get all reviews with stats & filters
// @route   GET /api/reviews
// @access  Public
exports.getReviews = async (req, res, next) => {
  try {

    const { rating, sort, search } = req.query;

    const filter = { status: 'approved' };

    if (rating && rating !== 'all') {
      const parsedRating = parseInt(rating, 10);
      if (!isNaN(parsedRating) && parsedRating >= 1 && parsedRating <= 5) {
        filter.rating = parsedRating;
      }
    }

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      filter.$or = [
        { name: searchRegex },
        { title: searchRegex },
        { comment: searchRegex },
        { coinPurchased: searchRegex },
        { location: searchRegex }
      ];
    }

    let sortQuery = { createdAt: -1 }; // default newest
    if (sort === 'highest') {
      sortQuery = { rating: -1, createdAt: -1 };
    } else if (sort === 'lowest') {
      sortQuery = { rating: 1, createdAt: -1 };
    } else if (sort === 'helpful') {
      sortQuery = { helpfulCount: -1, createdAt: -1 };
    }

    const reviews = await Review.find(filter).sort(sortQuery);

    // Compute overall statistics across all approved reviews (not just filtered ones)
    const allApproved = await Review.find({ status: 'approved' });
    const totalReviews = allApproved.length;

    let totalRatingSum = 0;
    const distribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    };

    allApproved.forEach((rev) => {
      const r = Math.min(Math.max(Math.round(rev.rating || 5), 1), 5);
      distribution[r] = (distribution[r] || 0) + 1;
      totalRatingSum += rev.rating;
    });

    const averageRating = totalReviews > 0 ? parseFloat((totalRatingSum / totalReviews).toFixed(1)) : 5.0;

    const breakdown = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: distribution[star] || 0,
      percentage: totalReviews > 0 ? Math.round(((distribution[star] || 0) / totalReviews) * 100) : 0
    }));

    res.json({
      success: true,
      data: {
        reviews,
        stats: {
          totalReviews,
          averageRating,
          breakdown
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit a customer review
// @route   POST /api/reviews
// @access  Public (or Authenticated)
exports.createReview = async (req, res, next) => {
  try {
    const { name, email, rating, title, comment, location, coinPurchased } = req.body;

    if (!name || !rating || !title || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide reviewer name, rating (1-5), title, and review comment'
      });
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be a number between 1 and 5'
      });
    }

    const review = await Review.create({
      name: name.trim(),
      email: email ? email.trim() : '',
      rating: numericRating,
      title: title.trim(),
      comment: comment.trim(),
      location: location ? location.trim() : 'India',
      coinPurchased: coinPurchased ? coinPurchased.trim() : 'Authenticated Numismatic Coin',
      isVerifiedBuyer: true,
      helpfulCount: 0,
      user: req.user ? req.user._id : null,
      status: 'approved'
    });

    res.status(201).json({
      success: true,
      message: 'Thank you! Your review has been published successfully.',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark review as helpful
// @route   POST /api/reviews/:id/helpful
// @access  Public
exports.markHelpful = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    review.helpfulCount = (review.helpfulCount || 0) + 1;
    await review.save();

    res.json({
      success: true,
      message: 'Marked as helpful',
      data: {
        id: review._id,
        helpfulCount: review.helpfulCount
      }
    });
  } catch (error) {
    next(error);
  }
};
