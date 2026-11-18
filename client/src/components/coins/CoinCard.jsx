import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiHeart, FiChevronDown, FiTrash2, FiShoppingCart, FiZap } from 'react-icons/fi';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { formatPrice, getConditionColor } from '../../utils/helpers';
import Button from '../common/Button';
import { STATIC_IMAGES } from '../../data/staticImages';

const CoinCard = ({ coin, showViewDetails = false }) => {
  const navigate = useNavigate();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToCart, removeFromCart, isInCart } = useCart();
  const { isDark } = useTheme();
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

  const imageSrc = coin.images && coin.images.length > 0 
    ? (typeof coin.images[0] === 'string' ? coin.images[0] : coin.images[0].url) 
    : STATIC_IMAGES.placeholders.coinCard;

  return (
    <div className={`rounded-xl overflow-hidden group transition-all duration-300 relative flex flex-col h-full card-hover border shadow-xs ${
      isDark 
        ? 'bg-dark-800 border-dark-600 hover:border-gold-500/40' 
        : 'bg-white border-gray-200 hover:border-gold-500/40'
    }`}>
      {/* Condition Badge */}
      <div className="absolute top-2 left-2 z-10">
        <span className={`px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold rounded tracking-wide shadow-xs ${getConditionColor(coin.condition)}`}>
          {coin.condition || 'VF'}
        </span>
      </div>

      {/* Wishlist Button */}
      <button 
        onClick={() => toggleWishlist(coin._id, coin)}
        aria-label={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
        className={`absolute top-2 right-2 z-10 p-1.5 rounded-full shadow-xs transition-transform active:scale-90 ${
          isDark ? 'bg-dark-700/80 backdrop-blur-xs text-gray-400 hover:text-red-500' : 'bg-white/90 backdrop-blur-xs text-gray-400 hover:text-red-500'
        }`}
      >
        <FiHeart className={`h-3.5 w-3.5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
      </button>

      {/* Image Container */}
      <Link to={`/coins/${coin.slug}`} className={`block relative pt-[90%] overflow-hidden ${
        isDark ? 'bg-dark-750' : 'bg-[#FAFAF7]'
      }`}>
        <img 
          src={imageSrc} 
          alt={coin.name}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-contain p-2 sm:p-3 transition-transform duration-500 group-hover:scale-105"
        />
      </Link>

      {/* Card Body */}
      <div className={`p-2.5 sm:p-3 flex flex-col flex-grow text-center border-t ${
        isDark ? 'border-dark-700' : 'border-gray-100'
      }`}>
        <Link to={`/coins/${coin.slug}`} className="block mb-1" title={coin.name}>
          <h3 className={`font-serif text-xs sm:text-sm font-semibold leading-tight transition-colors line-clamp-1 hover:text-gold-500 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {coin.name}
          </h3>
        </Link>
        
        {/* Country & Denomination info */}
        {(coin.country || coin.denomination) && (
          <p className={`text-[10px] sm:text-[11px] font-medium tracking-wide truncate ${
            isDark ? 'text-gold-400' : 'text-gold-600'
          }`}>
            {coin.country?.name || (typeof coin.country === 'string' && coin.country.length < 30 ? coin.country : '')}
            {coin.country && coin.denomination && ' • '}
            {coin.denomination || ''}
          </p>
        )}

        {/* Year & Mint Mark */}
        <p className={`text-[10px] sm:text-[11px] mb-2 tracking-wide uppercase truncate ${
          isDark ? 'text-gray-400' : 'text-gray-500'
        }`}>
          {coin.yearOfIssue || coin.year || 'Historical'} &middot; {coin.mint?.name || coin.mintMark || 'Heritage Mint'}
        </p>

        <div className="mt-auto pt-1 flex flex-col items-center w-full">
          <p className={`text-sm sm:text-base font-bold mb-2 ${isDark ? 'text-gold-400' : 'text-gray-900'}`}>
            {formatPrice(coin.sellingPrice || coin.price || 0)}
          </p>
          
          {showViewDetails ? (
            <div className="w-full flex items-center gap-1.5">
              <Link 
                to={`/coins/${coin.slug}`}
                className="flex-1"
              >
                <Button 
                  variant="outline" 
                  className="w-full text-[10px] sm:text-[11px] py-1.5 px-2 tracking-wider uppercase font-semibold min-h-[34px] sm:min-h-[36px] hover:border-gold-500 hover:text-gold-500 transition-colors"
                >
                  View Details
                </Button>
              </Link>
              
              <button
                type="button"
                onClick={() => {
                  if (inCart) {
                    navigate('/cart');
                  } else {
                    addToCart(coin._id);
                  }
                }}
                title={inCart ? 'View Cart' : 'Add to Cart'}
                aria-label={inCart ? 'View Cart' : 'Add to Cart'}
                className={`p-2 rounded-lg border transition-all duration-200 flex items-center justify-center min-h-[34px] sm:min-h-[36px] min-w-[36px] ${
                  inCart
                    ? 'bg-gradient-to-r from-gold-600 to-gold-500 text-white border-gold-600 shadow-gold'
                    : isDark
                      ? 'border-dark-600 hover:border-gold-500 text-gray-300 hover:text-gold-400 bg-dark-700/50'
                      : 'border-gray-200 hover:border-gold-500 text-gray-700 hover:text-gold-600 bg-gray-50'
                }`}
              >
                <FiShoppingCart className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="w-full relative flex shadow-xs" ref={dropdownRef}>
              <Button 
                variant={inCart ? 'primary' : 'outline'} 
                className="flex-1 text-[10px] sm:text-[11px] py-1.5 px-1.5 sm:px-2 tracking-wider uppercase rounded-r-none font-semibold min-h-[34px] sm:min-h-[36px]"
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
                className={`px-1.5 sm:px-2 transition-colors rounded-r-lg flex items-center justify-center border ${
                  inCart
                    ? 'bg-gradient-to-r from-gold-600 to-gold-500 text-white border-gold-600 hover:brightness-105'
                    : isDark 
                      ? 'border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-white' 
                      : 'border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-white'
                }`}
                title="More Actions"
                aria-label="More purchase options"
              >
                <FiChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Options Dropdown */}
              {showDropdown && (
                <div className={`absolute right-0 bottom-full mb-1.5 w-44 max-w-[calc(100vw-32px)] border rounded-xl shadow-2xl z-40 py-1 text-left ${
                  isDark ? 'bg-dark-800 border-dark-600' : 'bg-white border-gray-200'
                }`}>
                  {inCart ? (
                    <>
                      <button
                        onClick={() => { setShowDropdown(false); removeFromCart(coin._id); }}
                        className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 flex items-center space-x-2 transition-colors"
                      >
                        <FiTrash2 className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Remove</span>
                      </button>
                      <button
                        onClick={() => { setShowDropdown(false); navigate('/cart'); }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center space-x-2 transition-colors ${
                          isDark ? 'text-gray-300 hover:bg-dark-700 hover:text-gold-400' : 'text-gray-700 hover:bg-gold-50 hover:text-gold-600'
                        }`}
                      >
                        <FiShoppingCart className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>View Cart</span>
                      </button>
                      <button
                        onClick={() => { setShowDropdown(false); handleBuyNow(); }}
                        className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center space-x-2 transition-colors ${
                          isDark ? 'text-gold-400 hover:bg-dark-700' : 'text-gray-800 hover:bg-gold-50 hover:text-gold-600'
                        }`}
                      >
                        <FiZap className="w-3.5 h-3.5 text-gold-500 flex-shrink-0" />
                        <span>Buy Now</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => { setShowDropdown(false); addToCart(coin._id); }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center space-x-2 transition-colors ${
                          isDark ? 'text-gray-300 hover:bg-dark-700 hover:text-gold-400' : 'text-gray-700 hover:bg-gold-50 hover:text-gold-600'
                        }`}
                      >
                        <FiShoppingCart className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Add to Cart</span>
                      </button>
                      <button
                        onClick={() => { setShowDropdown(false); handleBuyNow(); }}
                        className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center space-x-2 transition-colors ${
                          isDark ? 'text-gold-400 hover:bg-dark-700' : 'text-gray-800 hover:bg-gold-50 hover:text-gold-600'
                        }`}
                      >
                        <FiZap className="w-3.5 h-3.5 text-gold-500 flex-shrink-0" />
                        <span>Buy Now</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoinCard;
