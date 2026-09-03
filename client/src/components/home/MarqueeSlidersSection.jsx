import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiInfo, FiZap, FiCompass } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import coinService from '../../services/coinService';
import { formatPrice } from '../../utils/helpers';
import { STATIC_IMAGES } from '../../data/staticImages';

// Fallback era/category cards for Slider 2 if categories API returns basic items
const DEFAULT_CURRENCY_TYPES = [
  {
    id: 'mughal-empire',
    name: 'Islamic & Mughal Empire',
    slug: 'islamic-mughal',
    subtitle: '1526 – 1857 CE',
    tag: 'Gold Mohurs & Silver Rupees',
    icon: '👑',
    gradient: 'from-amber-600/30 via-yellow-500/10 to-transparent',
    border: 'border-amber-500/30'
  },
  {
    id: 'british-india',
    name: 'British Crown India',
    slug: 'british-india',
    subtitle: '1858 – 1947 CE',
    tag: 'Victoria, Edward & George V',
    icon: '🇬🇧',
    gradient: 'from-blue-600/30 via-indigo-500/10 to-transparent',
    border: 'border-blue-500/30'
  },
  {
    id: 'east-india-company',
    name: 'East India Company',
    slug: 'eic',
    subtitle: '1600 – 1858 CE',
    tag: 'Uniform Presidency Coinage',
    icon: '⛵',
    gradient: 'from-gold-600/30 via-amber-500/10 to-transparent',
    border: 'border-gold-500/30'
  },
  {
    id: 'ancient-india',
    name: 'Ancient Indian Dynasties',
    slug: 'royal',
    subtitle: '600 BCE – 500 CE',
    tag: 'Maurya, Gupta & Kushan Dinars',
    icon: '🏛️',
    gradient: 'from-orange-600/30 via-amber-500/10 to-transparent',
    border: 'border-orange-500/30'
  },
  {
    id: 'princely-states',
    name: 'Princely States Coinage',
    slug: 'princely-states',
    subtitle: '1700 – 1948 CE',
    tag: 'Hyderabad, Mysore & Gwalior',
    icon: '🏰',
    gradient: 'from-purple-600/30 via-pink-500/10 to-transparent',
    border: 'border-purple-500/30'
  },
  {
    id: 'republic-india',
    name: 'Republic of India',
    slug: 'indian',
    subtitle: '1950 – Present',
    tag: 'Decimal Rupee & Anna Series',
    icon: '🇮🇳',
    gradient: 'from-emerald-600/30 via-teal-500/10 to-transparent',
    border: 'border-emerald-500/30'
  }
];

const MarqueeSlidersSection = () => {
  const { isDark } = useTheme();
  const [userCoins, setUserCoins] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserCatalog();
  }, []);

  const fetchUserCatalog = async () => {
    setLoading(true);
    try {
      const [coinsRes, catsRes] = await Promise.allSettled([
        coinService.getCoins({ limit: 100 }),
        coinService.getCategories()
      ]);

      if (coinsRes.status === 'fulfilled' && coinsRes.value) {
        const val = coinsRes.value;
        const list = val?.coins || (Array.isArray(val) ? val : (val?.data || []));
        setUserCoins(list);
      }

      if (catsRes.status === 'fulfilled' && catsRes.value) {
        const val = catsRes.value;
        const list = Array.isArray(val) ? val : (val?.data || []);
        if (list.length > 0) {
          setCategories(list);
        }
      }
    } catch (error) {
      console.error('Failed to load user catalog for marquee:', error);
    } finally {
      setLoading(false);
    }
  };

  // Build continuous marquee array exclusively from available coins
  let marqueeCoins = [];
  if (userCoins.length > 0) {
    marqueeCoins = [...userCoins];
    // Repeat array to ensure seamless infinite loop animation track
    while (marqueeCoins.length < 16) {
      marqueeCoins = [...marqueeCoins, ...userCoins];
    }
  }

  // Display categories for Slider 2
  const displayCategories = categories.length > 0 
    ? categories.map((cat, i) => ({
        id: cat._id || cat.slug || i,
        name: cat.name,
        slug: cat.slug || cat._id,
        subtitle: cat.description || 'Historical Category',
        tag: 'Authentic Specimen Collection',
        icon: ['👑', '🇬🇧', '🏛️', '🏰', '🇮🇳', '✨'][i % 6],
        gradient: 'from-amber-600/30 via-yellow-500/10 to-transparent',
        border: 'border-amber-500/30'
      }))
    : DEFAULT_CURRENCY_TYPES;

  let marqueeCategories = [...displayCategories];
  while (marqueeCategories.length < 12) {
    marqueeCategories = [...marqueeCategories, ...displayCategories];
  }

  return (
    <section className={`py-14 relative overflow-hidden border-y transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950 border-dark-800' 
        : 'bg-gradient-to-b from-[#F7F4EF] via-[#FAF8F5] to-[#F7F4EF] border-gray-200'
    }`}>
      {/* Background Ambient Glows */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest bg-gold-500/10 text-gold-500 border border-gold-500/20 mb-3">
              <FiZap className="w-3.5 h-3.5 animate-pulse text-gold-400" /> Catalog Live Stream
            </div>
            <h2 className={`text-3xl md:text-4xl font-serif leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Featured Coins & <span className="italic gradient-text-gold">Historical Currencies</span>
            </h2>
            <p className={`text-sm mt-2 max-w-2xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Explore our live collection of rare historical coins. <span className="font-semibold text-gold-500">Hover over any coin to pause</span> and click to inspect details.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-xs font-medium px-3 py-1.5 rounded-full border flex items-center gap-1.5 ${
              isDark ? 'bg-dark-800 border-dark-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700'
            }`}>
              <FiInfo className="w-3.5 h-3.5 text-gold-500" /> Hover to Pause &bull; Click for Details
            </span>
            <Link 
              to="/explore" 
              className="text-xs uppercase tracking-wider font-semibold text-gold-500 hover:text-gold-400 flex items-center gap-1 group transition-colors"
            >
              Explore All <FiArrowRight className="transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SLIDER 1: FEATURED COINS STREAM (AUTOMATIC RUNNING RIGHT TO LEFT) */}
      {/* ========================================================================= */}
      <div className="mb-10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className={`text-xs uppercase tracking-widest font-bold ${isDark ? 'text-gold-400' : 'text-gold-600'}`}>
              &larr; Live Coins Stream ({userCoins.length} Coins Available)
            </span>
          </div>
          <span className={`text-xs font-mono ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Auto Right-to-Left
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-gold-500 animate-pulse">
            Loading coins collection...
          </div>
        ) : marqueeCoins.length === 0 ? (
          <div className={`max-w-7xl mx-auto px-4 py-8 text-center border rounded-xl my-4 ${
            isDark ? 'bg-dark-800 border-dark-700 text-gray-400' : 'bg-white border-gray-200 text-gray-600'
          }`}>
            <p className="text-base font-serif mb-2 font-semibold">Coins Coming Soon!</p>
            <p className="text-xs">New historical coins will be added soon. Please check back later.</p>
          </div>
        ) : (
          /* Marquee Track Container */
          <div className="marquee-container overflow-hidden relative w-full py-2 group cursor-grab active:cursor-grabbing">
            {/* Vignette Edge Blurs */}
            <div className={`absolute top-0 bottom-0 left-0 w-16 sm:w-32 z-20 pointer-events-none bg-gradient-to-r ${
              isDark ? 'from-dark-950 to-transparent' : 'from-[#F7F4EF] to-transparent'
            }`}></div>
            <div className={`absolute top-0 bottom-0 right-0 w-16 sm:w-32 z-20 pointer-events-none bg-gradient-to-l ${
              isDark ? 'from-dark-950 to-transparent' : 'from-[#F7F4EF] to-transparent'
            }`}></div>

            {/* Marquee Track Right-to-Left */}
            <div className="animate-marquee-left flex gap-5 px-4">
              {marqueeCoins.map((coin, index) => {
                const coinSlug = coin.slug || coin._id;
                const coinImg = (coin.images && coin.images.length > 0) 
                  ? coin.images[0] 
                  : STATIC_IMAGES.placeholders.coinCard;
                const categoryName = coin.category?.name || 'Artifact';
                const eraName = coin.era || 'Historic Era';

                return (
                  <Link 
                    key={`${coin._id || index}-${index}`}
                    to={`/coins/${coinSlug}`}
                    className={`flex-shrink-0 w-72 sm:w-80 p-4 rounded-xl border transition-all duration-300 transform hover:-translate-y-1.5 hover:shadow-gold-lg relative group/card ${
                      isDark 
                        ? 'bg-dark-800/90 border-dark-700 hover:border-gold-500/60 backdrop-blur-md' 
                        : 'bg-white/90 border-gray-200 hover:border-gold-500/60 shadow-sm backdrop-blur-md'
                    }`}
                  >
                    {/* Rarity & Era Badges */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-gold-500/10 text-gold-500 border border-gold-500/20">
                        {eraName}
                      </span>
                      {coin.condition && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          isDark ? 'bg-dark-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {coin.condition}
                        </span>
                      )}
                    </div>

                    {/* Coin Image & Main Info */}
                    <div className="flex items-center gap-4 mb-3">
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex-shrink-0 p-1 bg-gradient-to-br from-gold-500/30 to-amber-700/20 border border-gold-500/30 shadow-inner group-hover/card:scale-105 transition-transform duration-300">
                        <img 
                          src={coinImg} 
                          alt={coin.name}
                          className="w-full h-full object-contain rounded-full drop-shadow-[0_4px_10px_rgba(0,0,0,0.4)]" 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-sm font-serif font-semibold truncate group-hover/card:text-gold-500 transition-colors ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}>
                          {coin.name}
                        </h3>
                        <p className={`text-xs mt-0.5 truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {coin.material || categoryName} {coin.denomination ? `• ${coin.denomination}` : ''}
                        </p>
                        {coin.yearOfIssue && (
                          <p className="text-xs font-mono text-gold-400 mt-1 font-semibold">
                            Year: {coin.yearOfIssue > 0 ? `${coin.yearOfIssue} CE` : `${Math.abs(coin.yearOfIssue)} BCE`}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Price & Action Footer */}
                    <div className={`pt-2.5 border-t flex items-center justify-between ${
                      isDark ? 'border-dark-700/80' : 'border-gray-100'
                    }`}>
                      <div>
                        <span className={`block text-[10px] uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          Selling Price
                        </span>
                        <span className={`text-base font-bold font-serif ${isDark ? 'text-gold-400' : 'text-gold-600'}`}>
                          {formatPrice(coin.sellingPrice || coin.price || 0)}
                        </span>
                      </div>

                      <span className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-gold-500 group-hover/card:translate-x-1 transition-transform">
                        Inspect <FiArrowRight className="ml-1 w-3.5 h-3.5" />
                      </span>
                    </div>

                    {/* Subtle Hover Border */}
                    <div className="absolute inset-0 rounded-xl border-2 border-gold-500/0 group-hover/card:border-gold-500/30 transition-colors pointer-events-none"></div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SLIDER 2: COIN TYPES & CURRENCIES (AUTOMATIC RUNNING LEFT TO RIGHT) */}
      {/* ========================================================================= */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse"></span>
            <span className={`text-xs uppercase tracking-widest font-bold ${isDark ? 'text-gold-400' : 'text-gold-600'}`}>
              Historical Coinage & Currency Dynasties (Left to Right Stream) &rarr;
            </span>
          </div>
          <span className={`text-xs font-mono ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Coin Categories
          </span>
        </div>

        {/* Marquee Track Container */}
        <div className="marquee-container overflow-hidden relative w-full py-2 group cursor-grab active:cursor-grabbing">
          {/* Vignette Edge Blurs */}
          <div className={`absolute top-0 bottom-0 left-0 w-16 sm:w-32 z-20 pointer-events-none bg-gradient-to-r ${
            isDark ? 'from-dark-950 to-transparent' : 'from-[#F7F4EF] to-transparent'
          }`}></div>
          <div className={`absolute top-0 bottom-0 right-0 w-16 sm:w-32 z-20 pointer-events-none bg-gradient-to-l ${
            isDark ? 'from-dark-950 to-transparent' : 'from-[#F7F4EF] to-transparent'
          }`}></div>

          {/* Marquee Track Left-to-Right */}
          <div className="animate-marquee-right flex gap-4 px-4">
            {marqueeCategories.map((cat, index) => (
              <Link 
                key={`${cat.id}-${index}`}
                to={`/explore?category=${cat.slug}`}
                className={`flex-shrink-0 w-64 sm:w-72 p-3.5 rounded-xl border transition-all duration-300 transform hover:-translate-y-1 hover:shadow-gold relative group/cat ${
                  isDark 
                    ? 'bg-dark-800/80 border-dark-700 hover:border-gold-500/50 backdrop-blur-sm' 
                    : 'bg-white/80 border-gray-200 hover:border-gold-500/50 shadow-sm backdrop-blur-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center text-xl bg-gradient-to-br ${cat.gradient} border ${cat.border} flex-shrink-0 group-hover/cat:scale-110 transition-transform duration-300`}>
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-xs font-serif font-bold truncate group-hover/cat:text-gold-500 transition-colors ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {cat.name}
                    </h4>
                    <span className="block text-[10px] text-gold-400 font-mono font-semibold truncate">
                      {cat.subtitle}
                    </span>
                    <span className={`block text-[10px] truncate mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {cat.tag}
                    </span>
                  </div>
                  <FiCompass className="w-4 h-4 text-gold-500/60 group-hover/cat:text-gold-500 group-hover/cat:rotate-45 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarqueeSlidersSection;
