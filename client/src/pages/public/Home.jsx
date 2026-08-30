import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import Button from '../../components/common/Button';
import { STATIC_IMAGES } from '../../data/staticImages';

const Home = () => {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative bg-[#FAFAF7] py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 z-10 text-center md:text-left mb-12 md:mb-0">
            <h1 className="text-4xl md:text-6xl font-serif text-[#1a1a1a] leading-tight mb-6">
              Discover India's History, <br/>
              <span className="italic text-[#B8860B]">One Coin at a Time.</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto md:mx-0 font-sans">
              Explore our curated collection of rare and authentic numismatic artifacts spanning millennia of Indian civilization.
            </p>
            <div className="flex flex-col sm:flex-row justify-center md:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
              <Link to="/explore">
                <Button size="lg" className="w-full sm:w-auto uppercase tracking-wider text-sm">
                  Explore Catalog
                </Button>
              </Link>
              <Link to="/about">
                <Button variant="outline" size="lg" className="w-full sm:w-auto uppercase tracking-wider text-sm">
                  Our Story
                </Button>
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 relative h-[400px] md:h-[500px] flex items-center justify-center">
            {/* Hero Image */}
            <div className="absolute inset-0 bg-[#B8860B] rounded-full opacity-5 blur-3xl transform translate-x-20"></div>
            <img 
              src={STATIC_IMAGES.hero.featuredArtefact} 
              alt="Rare historic coin" 
              className="w-3/4 max-w-md object-contain z-10 drop-shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Curated Periods */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-10 border-b border-gray-200 pb-4">
            <h2 className="text-3xl font-serif text-[#1a1a1a]">Curated Periods</h2>
            <Link to="/explore" className="text-[#B8860B] hover:text-[#8B6914] text-sm uppercase tracking-wider flex items-center group">
              View All <FiArrowRight className="ml-2 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STATIC_IMAGES.periods.map((period, i) => (
              <div key={period.id || i} className="relative h-64 overflow-hidden group cursor-pointer bg-gray-900">
                <img 
                  src={period.img} 
                  alt={period.title} 
                  className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6">
                  <h3 className="text-white text-xl font-serif">{period.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Guarantee */}
      <section className="py-20 bg-[#1a1a1a] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-serif mb-6 text-[#B8860B]">The CoinIndia Guarantee</h2>
              <p className="text-gray-300 mb-6 font-light leading-relaxed">
                Every artifact in our collection undergoes rigorous verification by expert numismatists. 
                We guarantee the authenticity of every coin we sell, providing a Certificate of Authenticity 
                with full historical provenance and technical specifications.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <span className="text-[#B8860B] mr-3">✦</span>
                  <span className="text-gray-300">Lifetime Authenticity Guarantee</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#B8860B] mr-3">✦</span>
                  <span className="text-gray-300">Secure Global Shipping</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#B8860B] mr-3">✦</span>
                  <span className="text-gray-300">Expert Appraisal Services</span>
                </li>
              </ul>
              <Link to="/about">
                <Button variant="outline" className="border-[#B8860B] text-[#B8860B] hover:bg-[#B8860B] hover:text-white uppercase tracking-wider text-sm">
                  Learn More
                </Button>
              </Link>
            </div>
            <div className="flex justify-center">
              <div className="border border-[#B8860B] p-2 max-w-sm w-full">
                <div className="bg-[#FAFAF7] text-[#1a1a1a] p-8 text-center h-full flex flex-col justify-center border border-[#e5e5e5]">
                  <h3 className="font-serif text-2xl mb-2">Certificate</h3>
                  <p className="text-xs uppercase tracking-[0.2em] mb-6">of Authenticity</p>
                  <p className="text-sm italic mb-8">This document certifies that the accompanying artifact is genuine and accurately described.</p>
                  <div className="border-t border-[#1a1a1a] mt-auto pt-4 w-3/4 mx-auto">
                    <p className="text-xs uppercase">Chief Numismatist</p>
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
