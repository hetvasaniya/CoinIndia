import { Link } from 'react-router-dom';
import { useWishlist } from '../../context/WishlistContext';
import CoinCard from '../../components/coins/CoinCard';
import EmptyState from '../../components/common/EmptyState';
import { FiHeart } from 'react-icons/fi';
import Button from '../../components/common/Button';

const Wishlist = () => {
  const { wishlistItems } = useWishlist();

  if (wishlistItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <EmptyState 
          title="Your Wishlist is Empty" 
          message="Keep track of artifacts you love by adding them to your wishlist."
          icon={<FiHeart className="h-12 w-12 text-gray-300" />}
          action={
            <Link to="/explore">
              <Button>Explore Catalog</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-serif text-[#1a1a1a] mb-8">My Wishlist</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {wishlistItems.map((item) => {
          const coinObj = item?.coin || item;
          return coinObj && coinObj._id ? <CoinCard key={coinObj._id} coin={coinObj} /> : null;
        })}
      </div>
    </div>
  );
};

export default Wishlist;
