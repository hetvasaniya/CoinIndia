import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiHeart, FiCheckCircle, FiChevronDown, FiShoppingCart, FiTrash2, FiZap, FiShield, FiTruck } from 'react-icons/fi';
import coinService from '../../services/coinService';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useTheme } from '../../context/ThemeContext';
import { formatPrice } from '../../utils/helpers';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import CoinGallery from '../../components/coins/CoinGallery';

const CoinDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [coin, setCoin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBuyDropdown, setShowBuyDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const { addToCart, removeFromCart, isInCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    fetchCoin();
  }, [slug]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowBuyDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCoin = async () => {
    try {
      const response = await coinService.getCoinBySlug(slug);
      const coinObj = response?._id ? response : (response?.data || response);
      setCoin(coinObj);
    } catch (error) {
      console.error('Error fetching coin', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;
  if (!coin) return <div className={`text-center py-20 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Coin artifact not found</div>;

  const isWishlisted = isInWishlist(coin._id);
  const inCart = isInCart(coin._id);

  const handleBuyNow = async () => {
    if (!inCart) {
      await addToCart(coin._id);
    }
    navigate('/checkout');
  };

  return (
    <div className={`min-h-screen py-12 transition-colors ${isDark ? 'bg-dark-900 text-gray-100' : 'bg-[#FAF8F5] text-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Left: Images */}
          <div className="relative">
            <CoinGallery images={coin.images} />
          </div>

          {/* Right: Info */}
          <div className="flex flex-col">
            <div className="flex items-center space-x-2 mb-4">
              <Link to={`/explore?category=${coin.category?._id}`} className="text-xs font-semibold text-gold-500 hover:underline uppercase tracking-widest">
                {coin.category?.name || 'Artifact'}
              </Link>
              <span className="text-gray-500">&bull;</span>
              <span className={`text-xs uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{coin.era}</span>
            </div>

            <h1 className={`text-3xl md:text-4xl font-serif mb-2 leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{coin.name}</h1>
            <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{coin.yearOfIssue || coin.year} &middot; {coin.condition} Grade</p>

            <div className={`text-3xl font-bold mb-8 ${isDark ? 'text-gold-400' : 'text-gray-900'}`}>{formatPrice(coin.sellingPrice || coin.price)}</div>

            {/* Buy Button with Options Toggle */}
            <div className="flex space-x-3 mb-8 relative" ref={dropdownRef}>
              <div className="flex-1 flex rounded-lg shadow-sm overflow-visible">
                <Button 
                  className="flex-1 py-3 text-xs tracking-widest uppercase rounded-r-none border-r border-gold-600 shadow-gold"
                  onClick={() => {
                    if (inCart) {
                      navigate('/cart');
                    } else {
                      addToCart(coin._id);
                    }
                  }}
                >
                  {inCart ? 'In Cart (Go to Cart)' : 'Add to Cart'}
                </Button>
                
                <button 
                  type="button"
                  onClick={() => setShowBuyDropdown(!showBuyDropdown)}
                  className="bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-white px-3 border-l border-gold-600/40 rounded-r-lg flex items-center justify-center transition-colors"
                  title="More Buy Options"
                >
                  <FiChevronDown className={`w-5 h-5 transition-transform duration-200 ${showBuyDropdown ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Dropdown */}
              {showBuyDropdown && (
                <div className={`absolute left-0 top-full mt-2 w-64 border rounded-xl shadow-xl z-40 py-2 divide-y ${
                  isDark ? 'bg-dark-800 border-dark-600 divide-dark-700' : 'bg-white border-gray-200 divide-gray-100'
                }`}>
                  <div className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Buy & Cart Options
                  </div>

                  {inCart ? (
                    <>
                      <button
                        onClick={() => { setShowBuyDropdown(false); removeFromCart(coin._id); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 flex items-center space-x-2 transition-colors"
                      >
                        <FiTrash2 className="w-4 h-4" />
                        <span>Remove from Cart</span>
                      </button>
                      <button
                        onClick={() => { setShowBuyDropdown(false); navigate('/cart'); }}
                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center space-x-2 transition-colors ${
                          isDark ? 'text-gray-300 hover:bg-dark-700 hover:text-gold-400' : 'text-gray-700 hover:bg-gold-50 hover:text-gold-600'
                        }`}
                      >
                        <FiShoppingCart className="w-4 h-4" />
                        <span>View Cart Details</span>
                      </button>
                      <button
                        onClick={() => { setShowBuyDropdown(false); handleBuyNow(); }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-center space-x-2 transition-colors ${
                          isDark ? 'text-gold-400 hover:bg-dark-700' : 'text-gray-800 hover:bg-gold-50 hover:text-gold-600'
                        }`}
                      >
                        <FiZap className="w-4 h-4 text-gold-500" />
                        <span>Proceed to Checkout</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => { setShowBuyDropdown(false); addToCart(coin._id); }}
                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center space-x-2 transition-colors ${
                          isDark ? 'text-gray-300 hover:bg-dark-700 hover:text-gold-400' : 'text-gray-700 hover:bg-gold-50 hover:text-gold-600'
                        }`}
                      >
                        <FiShoppingCart className="w-4 h-4" />
                        <span>Add to Cart</span>
                      </button>
                      <button
                        onClick={() => { setShowBuyDropdown(false); handleBuyNow(); }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-center space-x-2 transition-colors ${
                          isDark ? 'text-gold-400 hover:bg-dark-700' : 'text-gray-800 hover:bg-gold-50 hover:text-gold-600'
                        }`}
                      >
                        <FiZap className="w-4 h-4 text-gold-500" />
                        <span>Buy Now (Instant Checkout)</span>
                      </button>
                    </>
                  )}
                </div>
              )}

              <button 
                onClick={() => toggleWishlist(coin._id)}
                className={`px-4 border rounded-lg flex items-center justify-center transition-colors ${
                  isWishlisted 
                    ? 'bg-red-500/10 border-red-500/30' 
                    : isDark 
                      ? 'border-dark-600 hover:bg-dark-700' 
                      : 'border-gray-300 hover:bg-gray-50'
                }`}
                title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                <FiHeart className={`h-5 w-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
              </button>
            </div>

            {/* Authenticity card */}
            <div className={`p-6 border rounded-xl mb-8 ${
              isDark ? 'bg-dark-800 border-dark-700' : 'bg-[#FAFAF7] border-gray-200'
            }`}>
              <div className="flex items-start">
                <FiCheckCircle className="text-gold-500 h-6 w-6 mr-4 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className={`font-serif text-lg mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Authenticity Guaranteed</h4>
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Every artifact is meticulously verified by our expert numismatists. Includes a physical Certificate of Authenticity.
                  </p>
                </div>
              </div>
            </div>
            
            <div className={`border-t pt-6 mt-auto ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
               <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div>
                    <span className={`block text-xs mb-1 uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Availability</span>
                    <span className="font-medium text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded text-xs">Available in Stock</span>
                  </div>
                  <div>
                    <span className={`block text-xs mb-1 uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>SKU Identifier</span>
                    <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>{coin.sku || 'N/A'}</span>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Tabs / Specifications */}
        <div className={`border-t pt-16 ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Description */}
            <div className="md:col-span-2 space-y-12">
              <section>
                <h3 className={`text-2xl font-serif mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Historical Context</h3>
                <p className={`leading-relaxed whitespace-pre-line ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {coin.historicalSignificance || coin.description || 'No detailed historical context available for this artifact.'}
                </p>
              </section>

              {(coin.obverseDescription || coin.reverseDescription) && (
                <section className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {coin.obverseDescription && (
                    <div className={`p-5 rounded-xl border ${isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'}`}>
                      <h4 className={`font-serif text-lg mb-3 text-gold-500`}>Obverse Design</h4>
                      <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{coin.obverseDescription}</p>
                    </div>
                  )}
                  {coin.reverseDescription && (
                    <div className={`p-5 rounded-xl border ${isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'}`}>
                      <h4 className={`font-serif text-lg mb-3 text-gold-500`}>Reverse Design</h4>
                      <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{coin.reverseDescription}</p>
                    </div>
                  )}
                </section>
              )}
            </div>

            {/* Tech Specs */}
            <div>
              <div className={`border rounded-xl overflow-hidden ${isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'}`}>
                <h3 className={`font-serif text-lg px-6 py-4 border-b ${
                  isDark ? 'bg-dark-700/50 border-dark-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                }`}>
                  Technical Specifications
                </h3>
                <div className="p-6">
                  <dl className={`space-y-4 text-sm divide-y ${isDark ? 'divide-dark-700' : 'divide-gray-100'}`}>
                    {[
                      { label: 'Material', value: coin.material || 'N/A' },
                      { label: 'Weight', value: coin.weight ? `${coin.weight}g` : 'N/A' },
                      { label: 'Diameter', value: coin.diameter ? `${coin.diameter}mm` : 'N/A' },
                      { label: 'Denomination', value: coin.denomination || 'N/A' },
                      { label: 'Country', value: coin.country?.name || 'N/A' },
                      { label: 'Mint', value: coin.mint?.name || 'N/A' },
                    ].map((spec, i) => (
                      <div key={spec.label} className={`flex justify-between ${i > 0 ? 'pt-3' : ''}`}>
                        <dt className={isDark ? 'text-gray-400' : 'text-gray-500'}>{spec.label}</dt>
                        <dd className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{spec.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoinDetail;
