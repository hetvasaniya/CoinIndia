import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiHeart, FiChevronDown, FiTrash2, FiShoppingCart, FiZap } from 'react-icons/fi';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { formatPrice, getConditionColor } from '../../utils/helpers';
import Button from '../common/Button';
import { STATIC_IMAGES } from '../../data/staticImages';

const CoinCard = ({ coin }) => {
  const navigate = useNavigate();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToCart, removeFromCart, isInCart } = useCart();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const isWishlisted = isInWishlist(coin._id);
  const inCart = isInCart(coin._id);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBuyNow = async () => {
    if (!inCart) {
      await addToCart(coin._id);
    }
    navigate('/checkout');
  };

  return (
    <div className="bg-white border border-[#e5e5e5] rounded-sm overflow-hidden group hover:shadow-lg transition-shadow duration-300 relative flex flex-col h-full">
      {/* Condition Badge */}
      <div className="absolute top-3 left-3 z-10">
        <span className={`px-2 py-1 text-xs font-bold rounded-sm ${getConditionColor(coin.condition)}`}>
          {coin.condition}
        </span>
      </div>

      {/* Wishlist Button */}
      <button 
        onClick={() => toggleWishlist(coin._id)}
        className="absolute top-3 right-3 z-10 p-1.5 bg-white rounded-full shadow-sm text-gray-400 hover:text-red-500 transition-colors"
      >
        <FiHeart className={`h-4 w-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
      </button>

      {/* Image */}
      <Link to={`/coins/${coin.slug}`} className="block relative pt-[100%] bg-[#FAFAF7] overflow-hidden">
        <img 
          src={coin.images && coin.images.length > 0 ? (typeof coin.images[0] === 'string' ? coin.images[0] : coin.images[0].url) : STATIC_IMAGES.placeholders.coinCard} 
          alt={coin.name}
          className="absolute inset-0 w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110"
        />
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow text-center border-t border-gray-100">
        <Link to={`/coins/${coin.slug}`} className="block mb-1">
          <h3 className="font-serif text-[#1a1a1a] text-lg hover:text-[#B8860B] transition-colors line-clamp-2">
            {coin.name}
          </h3>
        </Link>
        
        <p className="text-xs text-gray-500 mb-3 tracking-wide uppercase">
          {coin.yearOfIssue || coin.year} &middot; {coin.mint?.name || coin.mintMark || 'Mint Mark'}
        </p>

        <div className="mt-auto pt-2 flex flex-col items-center">
          <p className="text-lg font-medium text-[#1a1a1a] mb-4">
            {formatPrice(coin.sellingPrice || coin.price)}
          </p>
          
          <div className="w-full relative flex" ref={dropdownRef}>
            <Button 
              variant={inCart ? "default" : "outline"} 
              className={`flex-1 text-xs py-2 tracking-wider uppercase rounded-r-none border-r ${
                inCart 
                  ? 'bg-[#B8860B] text-white border-amber-700 hover:bg-[#966d09]' 
                  : 'border-[#1a1a1a] text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white'
              }`}
              onClick={() => {
                if (inCart) {
                  navigate('/cart');
                } else {
                  addToCart(coin._id);
                }
              }}
            >
              {inCart ? 'IN CART' : 'ADD'}
            </Button>
            
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className={`px-2 transition-colors rounded-r-sm flex items-center justify-center border ${
                inCart
                  ? 'bg-[#B8860B] hover:bg-[#966d09] text-white border-amber-700'
                  : 'border-[#1a1a1a] border-l-0 text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white'
              }`}
              title="Options"
            >
              <FiChevronDown className={`w-4 h-4 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showDropdown && (
              <div className="absolute right-0 bottom-full mb-2 w-52 bg-white border border-gray-200 rounded shadow-xl z-40 py-1 text-left">
                {inCart ? (
                  <>
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        removeFromCart(coin._id);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <FiTrash2 className="w-3.5 h-3.5 text-red-500" />
                      <span>Remove from Cart</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        navigate('/cart');
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-amber-50 hover:text-[#B8860B] flex items-center space-x-2"
                    >
                      <FiShoppingCart className="w-3.5 h-3.5" />
                      <span>Go to Cart</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        handleBuyNow();
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-amber-50 hover:text-[#B8860B] flex items-center space-x-2"
                    >
                      <FiZap className="w-3.5 h-3.5 text-amber-600" />
                      <span>Buy Now</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        addToCart(coin._id);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-amber-50 hover:text-[#B8860B] flex items-center space-x-2"
                    >
                      <FiShoppingCart className="w-3.5 h-3.5" />
                      <span>Add to Cart</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        handleBuyNow();
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-amber-50 hover:text-[#B8860B] flex items-center space-x-2"
                    >
                      <FiZap className="w-3.5 h-3.5 text-amber-600" />
                      <span>Buy Now</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoinCard;
