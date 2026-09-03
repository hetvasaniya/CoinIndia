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

  if (loading) return <div className={`text-center py-20 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Loading wishlist...</div>;

  return (
    <div className={`min-h-screen py-12 transition-colors ${isDark ? 'bg-dark-900 text-gray-100' : 'bg-[#FAF8F5] text-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className={`text-3xl font-serif mb-8 ${isDark ? 'text-white' : 'text-gray-900'}`}>Saved Artifacts</h1>
        
        {coins.length === 0 ? (
          <EmptyState 
            title="Your Wishlist is Empty" 
            message="Save rare coins and currency notes you're interested in for later."
            icon={<FiHeart className={`h-12 w-12 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />}
            action={
              <Link to="/explore">
                <Button>Explore Catalog</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
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
