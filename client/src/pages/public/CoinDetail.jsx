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
import RelatedCoins from '../../components/coins/RelatedCoins';

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      setLoading(true);
      const response = await coinService.getCoinBySlug(slug);
      const coinObj = response?._id ? response : (response?.data || response);
      setCoin(coinObj);
    } catch (error) {
      console.error('Error fetching coin', error);
      setCoin(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;
  if (!coin) return (
    <div className={`min-h-[50vh] flex flex-col items-center justify-center p-6 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
      <h2 className="text-xl font-serif mb-2">Coin artifact not found</h2>
      <Link to="/explore">
        <Button variant="outline" className="text-sm mt-2">Back to Catalog</Button>
      </Link>
    </div>
  );

  const isWishlisted = isInWishlist(coin._id);
  const inCart = isInCart(coin._id);

  const handleBuyNow = async () => {
    if (!inCart) {
      await addToCart(coin._id);
    }
    navigate('/checkout');
  };

  return (
    <div className={`min-h-screen py-6 sm:py-12 transition-colors ${isDark ? 'bg-dark-900 text-gray-100' : 'bg-[#FAF8F5] text-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <nav className="mb-4 text-xs flex items-center space-x-2 text-gray-400">
          <Link to="/" className="hover:text-gold-500 transition-colors">Home</Link>
          <span>/</span>
          <Link to="/explore" className="hover:text-gold-500 transition-colors">Catalog</Link>
          <span>/</span>
          <span className={`truncate max-w-[200px] sm:max-w-none ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{coin.name}</span>
        </nav>

        {/* Main Product Details Grid (Stacks vertically on mobile, side-by-side on lg) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12 sm:mb-16">
          {/* Left Column: Interactive Image Gallery */}
          <div className="relative w-full max-w-full">
            <CoinGallery images={coin.images} />
          </div>

          {/* Right Column: Coin Artifact Information */}
          <div className="flex flex-col justify-start">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Link 
                to={`/explore?category=${coin.category?._id}`} 
                className="text-xs font-bold text-gold-500 hover:underline uppercase tracking-widest bg-gold-500/10 px-2.5 py-0.5 rounded-full border border-gold-500/20"
              >
                {coin.category?.name || 'Numismatic Artifact'}
              </Link>
              <span className="text-gray-500">&bull;</span>
              <span className={`text-xs uppercase tracking-widest font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {coin.era || 'Historical Era'}
              </span>
            </div>

            <h1 className={`text-2xl sm:text-3xl md:text-4xl font-serif font-bold mb-2 leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {coin.name}
            </h1>
            
            <p className={`text-xs sm:text-sm mb-4 sm:mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {coin.yearOfIssue || coin.year || 'Historical Year'} &middot; <span className="font-semibold text-gold-500">{coin.condition || 'UNC'}</span> Grade Specimen
            </p>

            <div className={`text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 ${isDark ? 'text-gold-400' : 'text-gray-900'}`}>
              {formatPrice(coin.sellingPrice || coin.price || 0)}
            </div>

            {/* Buy / Cart Action Row */}
            <div className="flex items-stretch gap-2 sm:gap-3 mb-6 sm:mb-8 relative" ref={dropdownRef}>
              <div className="flex-1 flex rounded-xl shadow-xs overflow-visible">
                <Button 
                  className="flex-1 py-3 px-3 text-xs sm:text-sm tracking-wider uppercase rounded-r-none border-r border-gold-600 shadow-gold"
                  onClick={() => {
                    if (inCart) {
                      navigate('/cart');
                    } else {
                      addToCart(coin._id);
                    }
                  }}
                >
                  {inCart ? 'In Cart (View)' : 'Add to Cart'}
                </Button>
                
                <button 
                  type="button"
                  onClick={() => setShowBuyDropdown(!showBuyDropdown)}
                  className="bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-white px-3 sm:px-4 border-l border-gold-600/40 rounded-r-xl flex items-center justify-center transition-colors"
                  title="More Buy Options"
                  aria-label="More purchase options"
                >
                  <FiChevronDown className={`w-5 h-5 transition-transform duration-200 ${showBuyDropdown ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Wishlist Button */}
              <button 
                onClick={() => toggleWishlist(coin._id, coin)}
                className={`px-3.5 sm:px-4 border rounded-xl flex items-center justify-center transition-colors ${
                  isWishlisted 
                    ? 'bg-red-500/10 border-red-500/40 text-red-500' 
                    : isDark 
                      ? 'border-dark-600 bg-dark-800 text-gray-400 hover:text-red-500 hover:bg-dark-700' 
                      : 'border-gray-300 bg-white text-gray-500 hover:text-red-500 hover:bg-gray-50'
                }`}
                title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                aria-label="Wishlist"
              >
                <FiHeart className={`h-5 w-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
              </button>

              {/* Buy Options Dropdown */}
              {showBuyDropdown && (
                <div className={`absolute left-0 top-full mt-2 w-64 max-w-[calc(100vw-32px)] border rounded-xl shadow-2xl z-40 py-2 divide-y ${
                  isDark ? 'bg-dark-800 border-dark-600 divide-dark-700 text-gray-200' : 'bg-white border-gray-200 divide-gray-100 text-gray-800'
                }`}>
                  <div className={`px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Purchase Options
                  </div>

                  {inCart ? (
                    <>
                      <button
                        onClick={() => { setShowBuyDropdown(false); removeFromCart(coin._id); }}
                        className="w-full text-left px-4 py-2.5 text-xs sm:text-sm text-red-500 hover:bg-red-500/10 flex items-center space-x-2 transition-colors"
                      >
                        <FiTrash2 className="w-4 h-4" />
                        <span>Remove from Cart</span>
                      </button>
                      <button
                        onClick={() => { setShowBuyDropdown(false); navigate('/cart'); }}
                        className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm flex items-center space-x-2 transition-colors ${
                          isDark ? 'hover:bg-dark-700 hover:text-gold-400' : 'hover:bg-gold-50 hover:text-gold-600'
                        }`}
                      >
                        <FiShoppingCart className="w-4 h-4" />
                        <span>View Cart Details</span>
                      </button>
                      <button
                        onClick={() => { setShowBuyDropdown(false); handleBuyNow(); }}
                        className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm font-semibold flex items-center space-x-2 transition-colors ${
                          isDark ? 'text-gold-400 hover:bg-dark-700' : 'text-gold-600 hover:bg-gold-50'
                        }`}
                      >
                        <FiZap className="w-4 h-4 text-gold-500" />
                        <span>Proceed to Instant Checkout</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => { setShowBuyDropdown(false); addToCart(coin._id); }}
                        className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm flex items-center space-x-2 transition-colors ${
                          isDark ? 'hover:bg-dark-700 hover:text-gold-400' : 'hover:bg-gold-50 hover:text-gold-600'
                        }`}
                      >
                        <FiShoppingCart className="w-4 h-4" />
                        <span>Add to Cart</span>
                      </button>
                      <button
                        onClick={() => { setShowBuyDropdown(false); handleBuyNow(); }}
                        className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm font-semibold flex items-center space-x-2 transition-colors ${
                          isDark ? 'text-gold-400 hover:bg-dark-700' : 'text-gold-600 hover:bg-gold-50'
                        }`}
                      >
                        <FiZap className="w-4 h-4 text-gold-500" />
                        <span>Buy Now (Instant Checkout)</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Authenticity Card */}
            <div className={`p-4 sm:p-6 border rounded-xl mb-6 sm:mb-8 ${
              isDark ? 'bg-dark-800 border-dark-700' : 'bg-[#FAFAF7] border-gray-200'
            }`}>
              <div className="flex items-start">
                <FiCheckCircle className="text-gold-500 h-5 w-5 sm:h-6 sm:w-6 mr-3 sm:mr-4 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className={`font-serif text-base sm:text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Authenticity Guaranteed
                  </h4>
                  <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Every artifact is meticulously verified by our expert numismatists. Includes a physical Certificate of Authenticity and tamper-evident casing.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Availability & SKU Identifier */}
            <div className={`border-t pt-5 mt-auto ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
              <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
                <div>
                  <span className={`block text-[10px] sm:text-xs mb-1 uppercase tracking-wider font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Availability
                  </span>
                  <span className="font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-xs inline-block">
                    {coin.quantity > 0 ? `${coin.quantity} In Stock` : 'Out of Stock'}
                  </span>
                </div>
                <div>
                  <span className={`block text-[10px] sm:text-xs mb-1 uppercase tracking-wider font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    SKU Identifier
                  </span>
                  <span className={`font-mono font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                    {coin.sku || 'CAT-HIST-001'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Historical Context & Technical Specifications (Responsive Stack) */}
        <div className={`border-t pt-10 sm:pt-14 ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12">
            
            {/* Description & Artwork Details */}
            <div className="lg:col-span-2 space-y-8">
              <section>
                <h3 className={`text-xl sm:text-2xl font-serif font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Historical Context & Provenance
                </h3>
                <p className={`text-sm sm:text-base leading-relaxed whitespace-pre-line ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {coin.historicalSignificance || coin.description || 'No detailed historical context recorded for this numismatic specimen.'}
                </p>
              </section>

              {(coin.obverseDescription || coin.reverseDescription) && (
                <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {coin.obverseDescription && (
                    <div className={`p-4 sm:p-5 rounded-xl border ${isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'}`}>
                      <h4 className="font-serif text-base sm:text-lg mb-2 text-gold-500 font-semibold">
                        Obverse (Front) Design
                      </h4>
                      <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {coin.obverseDescription}
                      </p>
                    </div>
                  )}
                  {coin.reverseDescription && (
                    <div className={`p-4 sm:p-5 rounded-xl border ${isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'}`}>
                      <h4 className="font-serif text-base sm:text-lg mb-2 text-gold-500 font-semibold">
                        Reverse (Back) Design
                      </h4>
                      <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {coin.reverseDescription}
                      </p>
                    </div>
                  )}
                </section>
              )}
            </div>

            {/* Technical Specifications Table */}
            <div>
              <div className={`border rounded-xl overflow-hidden shadow-xs ${isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'}`}>
                <h3 className={`font-serif text-base sm:text-lg px-5 py-3.5 border-b font-bold ${
                  isDark ? 'bg-dark-750/50 border-dark-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                }`}>
                  Technical Specifications
                </h3>
                <div className="p-4 sm:p-5">
                  <dl className={`space-y-3 text-xs sm:text-sm divide-y ${isDark ? 'divide-dark-700' : 'divide-gray-100'}`}>
                    {[
                      { label: 'Material / Alloy', value: coin.material || 'N/A' },
                      { label: 'Weight', value: coin.weight ? `${coin.weight}g` : 'N/A' },
                      { label: 'Diameter', value: coin.diameter ? `${coin.diameter}mm` : 'N/A' },
                      { label: 'Face Denomination', value: coin.denomination || 'N/A' },
                      { label: 'Country of Origin', value: coin.country?.name || 'India' },
                      { label: 'Mint of Origin', value: coin.mint?.name || 'N/A' },
                    ].map((spec, i) => (
                      <div key={spec.label} className={`flex justify-between items-center ${i > 0 ? 'pt-2.5' : ''}`}>
                        <dt className={isDark ? 'text-gray-400' : 'text-gray-500'}>{spec.label}</dt>
                        <dd className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{spec.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* You May Also Like / Related Coins Section */}
        <RelatedCoins currentCoin={coin} />

      </div>
    </div>
  );
};

export default CoinDetail;
