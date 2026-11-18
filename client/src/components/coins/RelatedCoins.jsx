import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiCompass } from 'react-icons/fi';
import coinService from '../../services/coinService';
import CoinCard from './CoinCard';
import { useTheme } from '../../context/ThemeContext';

/**
 * RelatedCoins / You May Also Like Section
 * Dynamically displays 4-8 recommended coins matching country, denomination,
 * category, or mint, with automatic fallback to other available coins.
 */
const RelatedCoins = ({ currentCoin }) => {
  const { isDark } = useTheme();
  const [relatedCoins, setRelatedCoins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchRelated = async () => {
      const identifier = currentCoin?.slug || currentCoin?._id;
      if (!identifier) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        if (isMounted) setLoading(true);
        const data = await coinService.getRelatedCoins(identifier, { limit: 8 });
        const coinsList = Array.isArray(data) ? data : (data?.data || []);
        if (isMounted) {
          setRelatedCoins(coinsList);
        }
      } catch (err) {
        console.error('Failed to load related coins:', err);
        if (isMounted) {
          setRelatedCoins([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchRelated();

    return () => {
      isMounted = false;
    };
  }, [currentCoin?._id, currentCoin?.slug]);

  // Loading skeleton state
  if (loading) {
    return (
      <section 
        aria-label="Related Coins Loading"
        className={`mt-12 sm:mt-16 border-t pt-10 sm:pt-14 transition-colors ${
          isDark ? 'border-dark-700' : 'border-gray-200'
        }`}
      >
        {/* Section Header Skeleton */}
        <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 sm:mb-8 border-b pb-4 ${
          isDark ? 'border-dark-700' : 'border-gray-200'
        }`}>
          <div>
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-gold-500 font-semibold mb-1">
              <FiCompass className="w-3.5 h-3.5 animate-spin" />
              <span>Curated Recommendations</span>
            </div>
            <h2 className={`text-2xl sm:text-3xl font-serif font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              You May Also Like
            </h2>
            <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Discover more unique coins from our collection.
            </p>
          </div>
          
          <Link 
            to="/explore" 
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm uppercase tracking-wider font-semibold text-gold-500 hover:text-gold-400 transition-colors self-start sm:self-end"
          >
            <span>View All Coins</span>
            <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Card Skeletons (4 responsive cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {[...Array(4)].map((_, i) => (
            <div 
              key={i} 
              className={`border p-3 sm:p-4 rounded-xl flex flex-col animate-pulse ${
                isDark ? 'bg-dark-800 border-dark-600' : 'bg-white border-gray-100 shadow-xs'
              }`}
            >
              <div className={`aspect-square w-full mb-3 rounded-lg ${isDark ? 'bg-dark-700' : 'bg-gray-200'}`}></div>
              <div className={`h-4 w-3/4 mx-auto mb-2 rounded ${isDark ? 'bg-dark-700' : 'bg-gray-200'}`}></div>
              <div className={`h-3 w-1/2 mx-auto mb-3 rounded ${isDark ? 'bg-dark-700' : 'bg-gray-200'}`}></div>
              <div className={`h-4 w-1/3 mx-auto mt-auto mb-3 rounded ${isDark ? 'bg-dark-700' : 'bg-gray-200'}`}></div>
              <div className={`h-8 w-full rounded-lg ${isDark ? 'bg-dark-700' : 'bg-gray-200'}`}></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Gracefully hide section if no related coins are available
  if (!relatedCoins || relatedCoins.length === 0) {
    return null;
  }

  return (
    <section 
      aria-label="Related Coins"
      className={`mt-12 sm:mt-16 border-t pt-10 sm:pt-14 transition-colors ${
        isDark ? 'border-dark-700' : 'border-gray-200'
      }`}
    >
      {/* Section Header */}
      <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 sm:mb-8 border-b pb-4 ${
        isDark ? 'border-dark-700' : 'border-gray-200'
      }`}>
        <div>
          <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-gold-500 font-semibold mb-1">
            <FiCompass className="w-3.5 h-3.5" />
            <span>Curated Recommendations</span>
          </div>
          <h2 className={`text-2xl sm:text-3xl font-serif font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            You May Also Like
          </h2>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Discover more unique coins from our collection.
          </p>
        </div>
        
        <Link 
          to="/explore" 
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm uppercase tracking-wider font-semibold text-gold-500 hover:text-gold-400 transition-colors group self-start sm:self-end"
        >
          <span>View All Coins</span>
          <FiArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Related Coins Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {relatedCoins.map((coin) => (
          <CoinCard 
            key={coin._id} 
            coin={coin} 
            showViewDetails={true} 
          />
        ))}
      </div>
    </section>
  );
};

export default RelatedCoins;
