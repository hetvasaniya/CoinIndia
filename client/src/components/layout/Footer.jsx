import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

const Footer = () => {
  const { isDark } = useTheme();

  return (
    <footer className={`pt-16 pb-8 transition-colors ${
      isDark 
        ? 'bg-dark-950 border-t border-dark-700' 
        : 'bg-gray-900 border-t border-gray-800'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="mb-4 flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-gold-500/40 shadow-sm bg-dark-800 transition-transform group-hover:scale-105">
                <img 
                  src="https://res.cloudinary.com/elitehomes/image/upload/v1788148596/nedeqh3gfpeilb1sgiv7.png" 
                  alt="CoinIndia Logo" 
                  className="w-full h-full object-cover rounded-full" 
                />
              </div>
              <span className="text-2xl font-serif text-white tracking-wider font-bold">
                Coin<span className="text-gold-500">India</span>
              </span>
            </Link>
            <p className="text-gray-400 max-w-sm mt-4 text-sm leading-relaxed">
              Dedicated to the preservation and curation of India's rich numismatic heritage. Every artifact tells a story of empires, trade, and culture.
            </p>
          </div>
          
          <div>
            <h4 className="text-lg font-serif mb-4 text-gold-500">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/explore" className="text-gray-400 hover:text-gold-400 transition-colors text-sm">Explore Catalog</Link></li>
              <li><Link to="/about" className="text-gray-400 hover:text-gold-400 transition-colors text-sm">About Us</Link></li>
              <li><Link to="/reviews" className="text-gray-400 hover:text-gold-400 transition-colors text-sm">Customer Reviews</Link></li>
              <li><Link to="/support" className="text-gray-400 hover:text-gold-400 transition-colors text-sm">Help & Support</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-serif mb-4 text-gold-500">Support & Policies</h4>
            <ul className="space-y-2">
              <li><Link to="/support" className="text-gray-400 hover:text-gold-400 transition-colors text-sm">Help & Support Center</Link></li>
              <li><Link to="/support" className="text-gray-400 hover:text-gold-400 transition-colors text-sm">Contact Support</Link></li>
              <li><Link to="/support" className="text-gray-400 hover:text-gold-400 transition-colors text-sm">Shipping & Delivery Info</Link></li>
              <li><Link to="/support" className="text-gray-400 hover:text-gold-400 transition-colors text-sm">Privacy Policy PDF</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Coin India. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0 flex space-x-6 items-center">
            <span className="text-gray-500 text-sm">Newsletter</span>
            <div className="flex">
              <input 
                type="email" 
                placeholder="Email Address" 
                className="bg-white/10 text-white px-4 py-1.5 text-sm outline-none border border-white/20 focus:border-gold-500 rounded-l-lg placeholder-gray-500 transition-colors" 
              />
              <button className="bg-gradient-to-r from-gold-600 to-gold-400 text-dark-900 px-4 py-1.5 text-sm font-medium hover:from-gold-500 hover:to-gold-300 transition-all rounded-r-lg">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
