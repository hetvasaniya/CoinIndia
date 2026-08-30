import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiHeart, FiCheckCircle, FiChevronDown, FiShoppingCart, FiTrash2, FiZap } from 'react-icons/fi';
import coinService from '../../services/coinService';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { formatPrice } from '../../utils/helpers';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import CoinGallery from '../../components/coins/CoinGallery';

const CoinDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
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
  if (!coin) return <div className="text-center py-20">Coin not found</div>;

  const isWishlisted = isInWishlist(coin._id);
  const inCart = isInCart(coin._id);

  const handleBuyNow = async () => {
    if (!inCart) {
      await addToCart(coin._id);
    }
    navigate('/checkout');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        {/* Left: Images */}
        <div className="relative">
          <CoinGallery images={coin.images} />
        </div>

        {/* Right: Info */}
        <div className="flex flex-col">
          <div className="flex items-center space-x-2 mb-4">
            <Link to={`/explore?category=${coin.category?._id}`} className="text-sm text-[#B8860B] hover:underline uppercase tracking-wider">
              {coin.category?.name}
            </Link>
            <span className="text-gray-300">&bull;</span>
            <span className="text-sm text-gray-500 uppercase tracking-wider">{coin.era}</span>
          </div>

          <h1 className="text-4xl font-serif text-[#1a1a1a] mb-2 leading-tight">{coin.name}</h1>
          <p className="text-lg text-gray-500 mb-6">{coin.yearOfIssue} &middot; {coin.condition} Condition</p>

          <div className="text-3xl font-medium text-[#1a1a1a] mb-8">{formatPrice(coin.sellingPrice)}</div>

          {/* Buy Button with Options Toggle */}
          <div className="flex space-x-3 mb-8 relative" ref={dropdownRef}>
            <div className="flex-1 flex rounded-sm shadow-sm overflow-visible">
              <Button 
                className="flex-1 py-3 text-sm tracking-widest uppercase rounded-r-none border-r border-amber-700"
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
              
              {/* Toggle Options Button */}
              <button 
                type="button"
                onClick={() => setShowBuyDropdown(!showBuyDropdown)}
                className="bg-[#B8860B] hover:bg-[#966d09] text-white px-3 border-l border-amber-600/40 rounded-r-sm flex items-center justify-center transition-colors"
                title="More Buy Options"
              >
                <FiChevronDown className={`w-5 h-5 transition-transform duration-200 ${showBuyDropdown ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Toggle Dropdown Menu */}
            {showBuyDropdown && (
              <div className="absolute left-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded shadow-xl z-40 py-2 divide-y divide-gray-100 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Buy & Cart Options
                </div>

                {inCart ? (
                  <>
                    <button
                      onClick={() => {
                        setShowBuyDropdown(false);
                        removeFromCart(coin._id);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors"
                    >
                      <FiTrash2 className="w-4 h-4 text-red-500" />
                      <span>Remove from Cart</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowBuyDropdown(false);
                        navigate('/cart');
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 hover:text-[#B8860B] flex items-center space-x-2 transition-colors"
                    >
                      <FiShoppingCart className="w-4 h-4 text-gray-500" />
                      <span>View Cart Details</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowBuyDropdown(false);
                        handleBuyNow();
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-800 font-medium hover:bg-amber-50 hover:text-[#B8860B] flex items-center space-x-2 transition-colors"
                    >
                      <FiZap className="w-4 h-4 text-amber-600" />
                      <span>Proceed to Checkout</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setShowBuyDropdown(false);
                        addToCart(coin._id);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 hover:text-[#B8860B] flex items-center space-x-2 transition-colors"
                    >
                      <FiShoppingCart className="w-4 h-4 text-gray-500" />
                      <span>Add to Cart</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowBuyDropdown(false);
                        handleBuyNow();
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-800 font-medium hover:bg-amber-50 hover:text-[#B8860B] flex items-center space-x-2 transition-colors"
                    >
                      <FiZap className="w-4 h-4 text-amber-600" />
                      <span>Buy Now (Instant Checkout)</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowBuyDropdown(false);
                        navigate('/cart');
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 hover:text-[#B8860B] flex items-center space-x-2 transition-colors"
                    >
                      <FiShoppingCart className="w-4 h-4 text-gray-500" />
                      <span>Go to Cart Page</span>
                    </button>
                  </>
                )}
              </div>
            )}

            <button 
              onClick={() => toggleWishlist(coin._id)}
              className={`px-4 border border-gray-300 rounded-sm flex items-center justify-center transition-colors ${
                isWishlisted ? 'bg-red-50 border-red-200' : 'hover:bg-gray-50'
              }`}
              title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
            >
              <FiHeart className={`h-6 w-6 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
            </button>
          </div>

          <div className="bg-[#FAFAF7] p-6 border border-[#e5e5e5] rounded-sm mb-8">
            <div className="flex items-start">
              <FiCheckCircle className="text-[#B8860B] h-6 w-6 mr-4 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-serif text-[#1a1a1a] text-lg mb-1">Authenticity Guaranteed</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Every artifact is meticulously verified by our expert numismatists. 
                  Includes a physical Certificate of Authenticity.
                </p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-8 mt-auto">
             <div className="grid grid-cols-2 gap-y-4 text-sm">
                <div>
                  <span className="block text-gray-500 mb-1">Availability</span>
                  <span className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs">Available</span>
                </div>
                <div>
                  <span className="block text-gray-500 mb-1">SKU</span>
                  <span className="font-medium text-[#1a1a1a]">{coin.sku || 'N/A'}</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Tabs / Sections */}
      <div className="border-t border-gray-200 pt-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Main Description */}
          <div className="md:col-span-2 space-y-12">
            <section>
              <h3 className="text-2xl font-serif text-[#1a1a1a] mb-6">Historical Context</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {coin.historicalSignificance || coin.description || 'No detailed historical context available for this artifact.'}
              </p>
            </section>

            {(coin.obverseDescription || coin.reverseDescription) && (
              <section className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {coin.obverseDescription && (
                  <div>
                    <h4 className="font-serif text-[#1a1a1a] text-lg mb-3">Obverse Design</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">{coin.obverseDescription}</p>
                  </div>
                )}
                {coin.reverseDescription && (
                  <div>
                    <h4 className="font-serif text-[#1a1a1a] text-lg mb-3">Reverse Design</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">{coin.reverseDescription}</p>
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Specifications Table */}
          <div>
            <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
              <h3 className="bg-[#FAFAF7] font-serif text-[#1a1a1a] text-lg px-6 py-4 border-b border-gray-200">
                Technical Specifications
              </h3>
              <div className="p-6">
                <dl className="space-y-4 text-sm">
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <dt className="text-gray-500">Material</dt>
                    <dd className="font-medium text-[#1a1a1a]">{coin.material || 'N/A'}</dd>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <dt className="text-gray-500">Weight</dt>
                    <dd className="font-medium text-[#1a1a1a]">{coin.weight ? `${coin.weight}g` : 'N/A'}</dd>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <dt className="text-gray-500">Diameter</dt>
                    <dd className="font-medium text-[#1a1a1a]">{coin.diameter ? `${coin.diameter}mm` : 'N/A'}</dd>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <dt className="text-gray-500">Denomination</dt>
                    <dd className="font-medium text-[#1a1a1a]">{coin.denomination || 'N/A'}</dd>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <dt className="text-gray-500">Country of Origin</dt>
                    <dd className="font-medium text-[#1a1a1a]">{coin.country?.name || 'N/A'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Mint</dt>
                    <dd className="font-medium text-[#1a1a1a]">{coin.mint?.name || 'N/A'}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoinDetail;
