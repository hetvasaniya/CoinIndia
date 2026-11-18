import { useState, useEffect, useMemo } from 'react';
import { 
  FiSearch, FiCheckCircle, FiThumbsUp, FiEdit3, 
  FiShield, FiAward, FiX, FiUser, FiMapPin, FiCalendar, FiFilter
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import reviewService from '../../services/reviewService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Loader from '../../components/common/Loader';
import { validateReviewForm, isValidEmail } from '../../utils/validation';

// Dynamic Star Icon Component with support for partial/full gold fills
const StarIcon = ({ filled = false, percentage = 100, size = "w-5 h-5", className = "" }) => {
  if (percentage < 100 && percentage > 0) {
    return (
      <div className={`relative inline-block ${size} ${className}`}>
        {/* Empty Background Star */}
        <svg
          className={`w-full h-full text-gray-300 dark:text-gray-700`}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
        {/* Filled Star with width clipping */}
        <div
          className="absolute top-0 left-0 overflow-hidden"
          style={{ width: `${percentage}%` }}
        >
          <svg
            className={`w-full h-full text-gold-400`}
            style={{ width: size.includes('w-6') ? '24px' : size.includes('w-7') ? '28px' : '20px' }}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <svg
      className={`${size} ${filled ? 'text-gold-400 fill-gold-400' : 'text-gray-300 dark:text-gray-700 fill-none stroke-current stroke-2'} ${className}`}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
      />
    </svg>
  );
};

// Renders 5 stars for a numeric rating (e.g. 4.9 or 3)
const StarRating = ({ rating, size = "w-5 h-5" }) => {
  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const diff = rating - (star - 1);
        if (diff >= 1) {
          return <StarIcon key={star} filled={true} size={size} />;
        } else if (diff > 0) {
          return <StarIcon key={star} percentage={Math.round(diff * 100)} size={size} />;
        } else {
          return <StarIcon key={star} filled={false} size={size} />;
        }
      })}
    </div>
  );
};

// Interactive 5-Star Selector for submitting a review
const StarRatingInput = ({ value, onChange, hoverValue, setHoverValue }) => {
  const activeRating = hoverValue || value;

  const getRatingLabel = (val) => {
    switch (val) {
      case 1: return '1 / 5 - Disappointing';
      case 2: return '2 / 5 - Fair';
      case 3: return '3 / 5 - Good Quality';
      case 4: return '4 / 5 - Very Impressed';
      case 5: return '5 / 5 - Outstanding / Museum Grade';
      default: return 'Click to select rating (1 to 5 stars)';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        {[1, 2, 3, 4, 5].map((star) => {
          const isHighlighted = star <= activeRating;
          return (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => setHoverValue(star)}
              onMouseLeave={() => setHoverValue(0)}
              className="p-1 rounded-lg transition-transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
              title={`Rate ${star} out of 5 stars`}
              aria-label={`Rate ${star} out of 5 stars`}
            >
              <svg
                className={`w-8 h-8 transition-colors duration-150 ${
                  isHighlighted 
                    ? 'text-gold-400 fill-gold-400 drop-shadow-md' 
                    : 'text-gray-300 dark:text-gray-600 fill-none stroke-current stroke-2'
                }`}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                />
              </svg>
            </button>
          );
        })}
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-sm font-semibold text-gold-500">
          {getRatingLabel(activeRating)}
        </span>
        {value > 0 && (
          <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-gold-500/20 text-gold-400 border border-gold-500/30">
            {value} / 5
          </span>
        )}
      </div>
    </div>
  );
};

const Reviews = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 5.0,
    breakdown: [
      { star: 5, count: 0, percentage: 0 },
      { star: 4, count: 0, percentage: 0 },
      { star: 3, count: 0, percentage: 0 },
      { star: 2, count: 0, percentage: 0 },
      { star: 1, count: 0, percentage: 0 }
    ]
  });
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [selectedRating, setSelectedRating] = useState('all');
  const [sortOption, setSortOption] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [helpfulVoted, setHelpfulVoted] = useState({});

  // Review Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [starHover, setStarHover] = useState(0);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    rating: 5,
    title: '',
    comment: '',
    location: '',
    coinPurchased: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchReviews();
  }, [selectedRating, sortOption]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = {
        rating: selectedRating,
        sort: sortOption
      };
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      const data = await reviewService.getReviews(params);
      if (data) {
        setReviews(data.reviews || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReviews();
  };

  const handleHelpfulClick = async (reviewId) => {
    if (helpfulVoted[reviewId]) {
      toast('You already voted this review as helpful', { icon: 'ℹ️' });
      return;
    }

    try {
      setHelpfulVoted(prev => ({ ...prev, [reviewId]: true }));
      setReviews(prev =>
        prev.map(r => r._id === reviewId ? { ...r, helpfulCount: (r.helpfulCount || 0) + 1 } : r)
      );
      await reviewService.markHelpful(reviewId);
      toast.success('Thank you for your feedback!');
    } catch (error) {
      console.error('Failed to vote helpful:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (field) => {
    if (field === 'name' && formData.name) {
      if (formData.name.trim().length < 2) {
        setErrors((prev) => ({ ...prev, name: 'Name must be at least 2 characters' }));
      }
    }
    if (field === 'email' && formData.email && formData.email.trim()) {
      if (!isValidEmail(formData.email)) {
        setErrors((prev) => ({ ...prev, email: 'Please enter a valid email address' }));
      }
    }
    if (field === 'title' && formData.title) {
      if (formData.title.trim().length < 3) {
        setErrors((prev) => ({ ...prev, title: 'Headline must be at least 3 characters' }));
      }
    }
    if (field === 'comment' && formData.comment) {
      if (formData.comment.trim().length < 10) {
        setErrors((prev) => ({ ...prev, comment: 'Comment must be at least 10 characters' }));
      }
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    const { isValid, errors: validationErrors } = validateReviewForm(formData);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    try {
      setSubmitting(true);
      const res = await reviewService.createReview({
        name: formData.name.trim(),
        email: formData.email ? formData.email.trim() : undefined,
        rating: Number(formData.rating),
        title: formData.title.trim(),
        comment: formData.comment.trim(),
        location: formData.location ? formData.location.trim() : undefined,
        coinPurchased: formData.coinPurchased ? formData.coinPurchased.trim() : undefined
      });
      toast.success(res.message || 'Your review has been published successfully!');
      
      // Reset form and close modal
      setIsModalOpen(false);
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        rating: 5,
        title: '',
        comment: '',
        location: '',
        coinPurchased: ''
      });
      setErrors({});

      // Refresh reviews list
      fetchReviews();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const cardBg = isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200';

  return (
    <div className={`min-h-screen py-10 transition-colors ${isDark ? 'bg-dark-900 text-gray-100' : 'bg-[#FAF8F5] text-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

        {/* HERO / HEAD SECTION */}
        <div className={`p-6 sm:p-10 border rounded-2xl shadow-sm ${cardBg}`}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Title & Overall Average Score */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-gold-500/15 text-gold-400 font-semibold text-xs rounded-full uppercase tracking-wider border border-gold-500/20">
                  Verified Collector Community
                </span>
                <span className="flex items-center text-xs text-emerald-500 font-medium">
                  <FiCheckCircle className="mr-1" /> 100% Authenticity Backed
                </span>
              </div>

              <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Customer Reviews & Ratings
              </h1>

              <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Read transparent feedback from numismatists, museum curators, and passionate rare coin collectors across India. Every review represents genuine historical acquisitions.
              </p>

              {/* Total Average Score and Aggregate Stars */}
              <div className="pt-2 flex flex-wrap items-center gap-4 sm:gap-6">
                <div className="flex items-baseline space-x-2">
                  <span className="text-4xl sm:text-5xl font-serif font-bold text-gold-400">
                    {stats.averageRating.toFixed(1)}
                  </span>
                  <span className={`text-lg font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    / 5.0
                  </span>
                </div>

                <div className="space-y-1">
                  <StarRating rating={stats.averageRating} size="w-6 h-6" />
                  <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Based on <strong className={isDark ? 'text-white' : 'text-gray-900'}>{stats.totalReviews}</strong> verified reviews
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-gold-600 via-gold-500 to-gold-400 text-dark-950 font-bold text-sm shadow-gold hover:brightness-110 transition-all flex items-center space-x-2"
                >
                  <FiEdit3 className="text-lg" />
                  <span>Write a Review</span>
                </button>
              </div>
            </div>

            {/* Right Column: Rating Distribution Bar Chart */}
            <div className={`lg:col-span-6 p-6 rounded-xl border ${isDark ? 'bg-dark-900/60 border-dark-600' : 'bg-[#F5F2EB] border-gray-200'}`}>
              <h3 className={`text-base font-serif font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Rating Breakdown
              </h3>
              
              <div className="space-y-2.5">
                {stats.breakdown.map((item) => {
                  const isFilterActive = selectedRating === String(item.star);
                  return (
                    <button
                      key={item.star}
                      onClick={() => setSelectedRating(selectedRating === String(item.star) ? 'all' : String(item.star))}
                      className={`w-full flex items-center space-x-3 text-xs group transition-colors p-1.5 rounded-lg ${
                        isFilterActive 
                          ? isDark ? 'bg-dark-700/80 ring-1 ring-gold-500' : 'bg-white shadow-sm ring-1 ring-gold-500'
                          : 'hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                      title={`Filter by ${item.star} stars`}
                    >
                      <span className={`w-12 font-medium text-left flex items-center space-x-1 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        <span>{item.star}</span>
                        <StarIcon filled={true} size="w-3.5 h-3.5" />
                      </span>

                      {/* Progress bar */}
                      <div className="flex-1 h-3 rounded-full bg-gray-200 dark:bg-dark-700 overflow-hidden relative">
                        <div
                          className="h-full bg-gradient-to-r from-gold-600 to-gold-400 rounded-full transition-all duration-700"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>

                      {/* Percentage & Count */}
                      <span className={`w-16 text-right font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {item.percentage}% ({item.count})
                      </span>
                    </button>
                  );
                })}
              </div>

              {selectedRating !== 'all' && (
                <div className="mt-4 pt-3 border-t border-dashed border-gray-300 dark:border-dark-600 flex justify-between items-center text-xs">
                  <span className="text-gold-500 font-medium">
                    Filtering by {selectedRating} star reviews
                  </span>
                  <button
                    onClick={() => setSelectedRating('all')}
                    className="text-xs text-gray-500 hover:text-gold-400 underline font-medium"
                  >
                    Clear Filter
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* CONTROLS TOOLBAR: Filter by Stars, Search & Sort */}
        <div className={`p-4 sm:p-5 border rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 ${cardBg}`}>
          {/* Star Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <span className={`text-xs font-semibold uppercase tracking-wider mr-1 flex items-center ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <FiFilter className="mr-1" /> Filter:
            </span>
            {['all', '5', '4', '3', '2', '1'].map((val) => {
              const isActive = selectedRating === val;
              return (
                <button
                  key={val}
                  onClick={() => setSelectedRating(val)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-gold-600 to-gold-500 text-white shadow-sm'
                      : isDark
                        ? 'bg-dark-700/60 text-gray-300 hover:bg-dark-700 hover:text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {val === 'all' ? 'All Ratings' : `${val} Stars`}
                </button>
              );
            })}
          </div>

          {/* Search & Sort Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-60">
              <input
                type="text"
                placeholder="Search reviews & coins..."
                className={`w-full pl-9 pr-3 py-1.5 border rounded-lg text-xs transition-all focus:outline-none focus:border-gold-500 ${
                  isDark ? 'bg-dark-700 border-dark-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <FiSearch className={`absolute left-3 top-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            </form>

            {/* Sort Select */}
            <select
              className={`w-full sm:w-44 px-3 py-1.5 border rounded-lg text-xs transition-all focus:outline-none focus:border-gold-500 ${
                isDark ? 'bg-dark-700 border-dark-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="newest">Most Recent</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
              <option value="helpful">Most Helpful</option>
            </select>
          </div>
        </div>

        {/* REVIEWS LIST SECTION */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`p-6 rounded-2xl border animate-pulse space-y-4 ${cardBg}`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-full ${isDark ? 'bg-dark-700' : 'bg-gray-200'}`} />
                  <div className="space-y-2 flex-1">
                    <div className={`h-4 w-1/3 rounded ${isDark ? 'bg-dark-700' : 'bg-gray-200'}`} />
                    <div className={`h-3 w-1/4 rounded ${isDark ? 'bg-dark-700' : 'bg-gray-200'}`} />
                  </div>
                </div>
                <div className={`h-4 w-3/4 rounded ${isDark ? 'bg-dark-700' : 'bg-gray-200'}`} />
                <div className={`h-16 w-full rounded ${isDark ? 'bg-dark-700' : 'bg-gray-200'}`} />
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className={`p-12 text-center rounded-2xl border ${cardBg}`}>
            <FiAward className="mx-auto text-5xl text-gold-500/50 mb-3" />
            <h3 className="text-xl font-serif font-bold mb-1">No Reviews Found</h3>
            <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              No reviews match the current filter or search criteria.
            </p>
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedRating('all');
                  setSearchQuery('');
                  setSortOption('newest');
                }}
              >
                Clear All Filters
              </Button>
              <Button onClick={() => setIsModalOpen(true)}>
                Write the First Review
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map((review) => {
              const reviewerInitials = review.name
                ? review.name
                    .split(' ')
                    .filter(Boolean)
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()
                : 'U';

              const formattedDate = review.createdAt
                ? new Date(review.createdAt).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })
                : 'Recent';

              return (
                <div
                  key={review._id}
                  className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between hover:shadow-lg ${cardBg} ${
                    isDark ? 'hover:border-gold-500/40' : 'hover:border-gold-500/40'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header: Avatar, Name, Location & Verified Badge */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-gold-600 via-gold-500 to-amber-300 text-dark-950 font-bold text-sm flex items-center justify-center shadow-md flex-shrink-0">
                          {reviewerInitials}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className={`text-sm sm:text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {review.name}
                            </h4>
                            {review.isVerifiedBuyer && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                <FiCheckCircle className="mr-1" /> Verified Buyer
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {review.location && (
                              <span className="flex items-center">
                                <FiMapPin className="mr-1 text-[11px]" /> {review.location}
                              </span>
                            )}
                            <span className="flex items-center">
                              <FiCalendar className="mr-1 text-[11px]" /> {formattedDate}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Numeric Rating Badge */}
                      <div className="flex flex-col items-end">
                        <StarRating rating={review.rating} size="w-4 h-4" />
                        <span className="text-xs font-bold text-gold-400 mt-1">
                          {review.rating} / 5
                        </span>
                      </div>
                    </div>

                    {/* Coin Acquired / Tag */}
                    {review.coinPurchased && (
                      <div className={`px-3 py-1.5 rounded-lg text-xs font-medium border inline-flex items-center gap-1.5 ${
                        isDark ? 'bg-dark-700/50 border-dark-600 text-gold-400' : 'bg-gold-50/80 border-gold-200 text-gold-700'
                      }`}>
                        <FiShield className="text-xs" />
                        <span className="font-semibold">Acquired:</span> {review.coinPurchased}
                      </div>
                    )}

                    {/* Review Title */}
                    <h5 className={`font-serif text-base font-bold leading-snug ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {review.title}
                    </h5>

                    {/* Review Text */}
                    <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {review.comment}
                    </p>
                  </div>

                  {/* Footer / Thumbs Up Helpful */}
                  <div className="pt-4 mt-4 border-t border-gray-100 dark:border-dark-700 flex items-center justify-between">
                    <span className="text-[11px] text-gray-500">
                      Was this review helpful?
                    </span>
                    <button
                      type="button"
                      onClick={() => handleHelpfulClick(review._id)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        helpfulVoted[review._id]
                          ? 'bg-gold-500/20 text-gold-400 font-bold border border-gold-500/30'
                          : isDark
                            ? 'bg-dark-700/60 hover:bg-dark-700 text-gray-400 hover:text-gold-400'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gold-600'
                      }`}
                    >
                      <FiThumbsUp className={`text-xs ${helpfulVoted[review._id] ? 'fill-gold-400' : ''}`} />
                      <span>Helpful ({review.helpfulCount || 0})</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* WRITE A REVIEW MODAL */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
            <div className={`w-full max-w-xl max-h-[92vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-all ${
              isDark ? 'bg-dark-800 border-dark-600 text-white' : 'bg-white border-gray-200 text-gray-900'
            }`}>
              
              {/* Modal Header */}
              <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-dark-700 flex justify-between items-center flex-shrink-0">
                <div>
                  <h3 className="text-lg sm:text-xl font-serif font-bold">Write a Customer Review</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Share your numismatic artifact acquisition experience
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmitReview} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto touch-scroll flex-1" noValidate>
                
                {/* Interactive Star Rating Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Overall Rating (Click to Select) <span className="text-red-500">*</span>
                  </label>
                  <StarRatingInput
                    value={formData.rating}
                    onChange={(r) => {
                      setFormData({ ...formData, rating: r });
                      if (errors.rating) setErrors((prev) => ({ ...prev, rating: '' }));
                    }}
                    hoverValue={starHover}
                    setHoverValue={setStarHover}
                  />
                  {errors.rating && <p className="mt-1 text-xs text-red-500">{errors.rating}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Your Name *"
                    name="name"
                    placeholder="e.g. Vikramaditya Sharma"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={() => handleBlur('name')}
                    error={errors.name}
                  />

                  <Input
                    label="Location / City"
                    name="location"
                    placeholder="e.g. Mumbai, Maharashtra"
                    value={formData.location}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Coin / Artifact Purchased"
                    name="coinPurchased"
                    placeholder="e.g. King Edward VII 1907 Rupee"
                    value={formData.coinPurchased}
                    onChange={handleChange}
                  />

                  <Input
                    label="Email Address (Optional)"
                    name="email"
                    type="email"
                    placeholder="For authenticity certificate tie-in"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={() => handleBlur('email')}
                    error={errors.email}
                  />
                </div>

                <Input
                  label="Review Headline *"
                  name="title"
                  placeholder="e.g. Exceptional grading & museum-grade packaging"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  onBlur={() => handleBlur('title')}
                  error={errors.title}
                />

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Your Review & Experience <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows="4"
                    name="comment"
                    required
                    placeholder="Describe the condition, authenticity, shipping, and your overall numismatic experience..."
                    className={`w-full px-3.5 py-2.5 border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500 ${
                      errors.comment ? 'border-red-500' : isDark ? 'bg-dark-700 border-dark-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                    value={formData.comment}
                    onChange={handleChange}
                    onBlur={() => handleBlur('comment')}
                  ></textarea>
                  {errors.comment && <p className="mt-1 text-xs text-red-500">{errors.comment}</p>}
                </div>

                {/* Submit Actions */}
                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-3 border-t border-gray-200 dark:border-dark-700">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={submitting}
                    className="w-full sm:w-auto shadow-gold px-6"
                  >
                    Publish Review
                  </Button>
                </div>

              </form>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Reviews;
