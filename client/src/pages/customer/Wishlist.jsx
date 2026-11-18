import { Link } from 'react-router-dom';
import { useWishlist } from '../../context/WishlistContext';
import { useTheme } from '../../context/ThemeContext';
import CoinCard from '../../components/coins/CoinCard';
import EmptyState from '../../components/common/EmptyState';
import { FiHeart } from 'react-icons/fi';
import Button from '../../components/common/Button';

const Wishlist = () => {
  const { wishlist = [], loading } = useWishlist();
  const { isDark } = useTheme();
  const coins = Array.isArray(wishlist) ? wishlist : [];

  if (loading) return (
    <div className={`min-h-[50vh] flex items-center justify-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
      Loading saved artifacts...
    </div>
  );

  return (
    <div className={`min-h-screen py-6 sm:py-12 transition-colors ${isDark ? 'bg-dark-900 text-gray-100' : 'bg-[#FAF8F5] text-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-2">
          <h1 className={`text-2xl sm:text-3xl font-serif font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Saved Artifacts ({coins.length})
          </h1>
          <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Personal numismatic bookmarks and wishlist
          </p>
        </div>
        
        {coins.length === 0 ? (
          <EmptyState 
            title="Your Wishlist is Empty" 
            message="Save rare coins and currency notes you're interested in for later."
            icon={<FiHeart className={`h-12 w-12 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />}
            action={
              <Link to="/explore">
                <Button className="shadow-gold uppercase tracking-wider text-xs sm:text-sm">
                  Explore Catalog
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-4">
            {coins.map(coin => (
              <CoinCard key={coin._id} coin={coin} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
