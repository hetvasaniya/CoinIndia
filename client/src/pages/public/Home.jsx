import { Link } from 'react-router-dom';
import { FiArrowRight, FiShield, FiGlobe, FiAward, FiCheckCircle } from 'react-icons/fi';
import Button from '../../components/common/Button';
import { STATIC_IMAGES } from '../../data/staticImages';
import { useTheme } from '../../context/ThemeContext';
import MarqueeSlidersSection from '../../components/home/MarqueeSlidersSection';
import HeroVerticalCardSlider from '../../components/home/HeroVerticalCardSlider';

const Home = () => {
  const { isDark } = useTheme();

  return (
    <div className={`transition-colors duration-300 ${isDark ? 'bg-dark-900 text-gray-100' : 'bg-[#FAF8F5] text-gray-900'}`}>
      {/* Hero Section */}
      <section className={`relative py-12 sm:py-20 md:py-28 overflow-hidden ${
        isDark 
          ? 'bg-gradient-to-b from-dark-950 via-dark-900 to-dark-900' 
          : 'bg-gradient-to-b from-gold-50/50 via-[#FAF8F5] to-[#FAF8F5]'
      }`}>
        {/* Decorative Animated Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center relative z-10 gap-8 md:gap-4">
          <div className="md:w-1/2 text-center md:text-left mb-6 md:mb-0">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-gold-500/10 text-gold-500 border border-gold-500/20 mb-4 sm:mb-6">
              <FiAward className="w-3.5 h-3.5 flex-shrink-0" /> India's Premier Numismatic Marketplace
            </div>
            <h1 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif leading-tight mb-4 sm:mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Discover India's History, <br/>
              <span className="italic gradient-text-gold">One Coin at a Time.</span>
            </h1>
            <p className={`text-sm sm:text-base md:text-lg mb-6 sm:mb-8 max-w-lg mx-auto md:mx-0 font-sans leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Explore our curated collection of rare and authentic numismatic artifacts spanning millennia of Indian civilization.
            </p>
            <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-3 sm:gap-4">
              <Link to="/explore" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto uppercase tracking-wider text-sm shadow-gold">
                  Explore Catalog
                </Button>
              </Link>
              <Link to="/about" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto uppercase tracking-wider text-sm">
                  Our Story
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Side 3D Vertical Slider */}
          <div className="md:w-1/2 relative w-full flex items-center justify-center">
            <HeroVerticalCardSlider />
          </div>
        </div>
      </section>

      {/* Dual Infinite Marquee Sliders (Right-to-Left Coins & Left-to-Right Categories) */}
      <MarqueeSlidersSection />

      {/* Curated Periods */}
      <section className={`py-12 sm:py-20 border-t ${isDark ? 'border-dark-800 bg-dark-900' : 'border-gray-200 bg-white'}`}>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 mb-8 sm:mb-10 border-b pb-4 ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
            <div>
              <span className="text-xs uppercase tracking-widest text-gold-500 font-semibold">Chronological Collections</span>
              <h2 className={`text-2xl sm:text-3xl font-serif mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Curated Periods</h2>
            </div>
            <Link to="/explore" className="text-gold-500 hover:text-gold-400 text-xs sm:text-sm uppercase tracking-wider flex items-center group font-medium">
              View All <FiArrowRight className="ml-2 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {STATIC_IMAGES.periods.map((period, i) => (
              <div key={period.id || i} className={`relative h-72 rounded-xl overflow-hidden group cursor-pointer border transition-all duration-500 card-hover ${
                isDark ? 'border-dark-700 bg-dark-800' : 'border-gray-200 bg-gray-900'
              }`}>
                <img 
                  src={period.img} 
                  alt={period.title} 
                  className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/40 to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6">
                  <span className="text-xs text-gold-400 font-medium uppercase tracking-wider block mb-1">Era Specimen</span>
                  <h3 className="text-white text-xl font-serif group-hover:text-gold-400 transition-colors">{period.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Guarantee */}
      <section className={`py-20 relative overflow-hidden ${
        isDark ? 'bg-dark-950 text-white border-t border-dark-800' : 'bg-dark-900 text-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs uppercase tracking-widest text-gold-500 font-semibold mb-2 block">Trust & Integrity</span>
              <h2 className="text-3xl font-serif mb-6 text-gold-400">The Coinomart Guarantee</h2>
              <p className="text-gray-300 mb-6 font-light leading-relaxed">
                Every artifact in our collection undergoes rigorous verification by expert numismatists. 
                We guarantee the authenticity of every coin we sell, providing a Certificate of Authenticity 
                with full historical provenance and technical specifications.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <FiCheckCircle className="text-gold-500 mr-3 w-5 h-5 flex-shrink-0" />
                  <span className="text-gray-200">Lifetime Authenticity Guarantee</span>
                </li>
                <li className="flex items-center">
                  <FiGlobe className="text-gold-500 mr-3 w-5 h-5 flex-shrink-0" />
                  <span className="text-gray-200">Secure Global Shipping</span>
                </li>
                <li className="flex items-center">
                  <FiShield className="text-gold-500 mr-3 w-5 h-5 flex-shrink-0" />
                  <span className="text-gray-200">Expert Appraisal Services</span>
                </li>
              </ul>
              <Link to="/about">
                <Button variant="outline" className="border-gold-500 text-gold-400 hover:bg-gold-500 hover:text-dark-900 uppercase tracking-wider text-sm font-semibold">
                  Learn More
                </Button>
              </Link>
            </div>
            <div className="flex justify-center">
              <div className="border border-gold-500/40 p-3 max-w-sm w-full rounded-xl bg-dark-900/80 backdrop-blur-sm shadow-gold">
                <div className={`p-8 text-center h-full flex flex-col justify-center border rounded-lg ${
                  isDark ? 'bg-dark-800 border-dark-600 text-gray-100' : 'bg-[#FAF8F5] text-gray-900 border-gray-200'
                }`}>
                  <h3 className="font-serif text-2xl mb-1 text-gold-500">Certificate</h3>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-6">of Authenticity</p>
                  <p className="text-sm italic text-gray-400 mb-8 leading-relaxed">
                    This document certifies that the accompanying artifact is genuine, legally acquired, and accurately described by expert catalogers.
                  </p>
                  <div className={`border-t pt-4 w-3/4 mx-auto ${isDark ? 'border-dark-600' : 'border-gray-300'}`}>
                    <p className="text-xs uppercase tracking-widest text-gold-500 font-semibold">Chief Numismatist</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
