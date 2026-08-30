import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-[#001D39] to-[#0A4174] text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="text-3xl font-serif text-white tracking-wider mb-4 block">
              Coin<span className="text-[#7BBDE8]">India</span>
            </Link>
            <p className="text-gray-400 max-w-sm mt-4 text-sm leading-relaxed">
              Dedicated to the preservation and curation of India's rich numismatic heritage. Every artifact tells a story of empires, trade, and culture.
            </p>
          </div>
          
          <div>
            <h4 className="text-lg font-serif mb-4 text-[#7BBDE8]">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/explore" className="text-gray-400 hover:text-white transition-colors text-sm">Explore Catalog</Link></li>
              <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors text-sm">About Us</Link></li>
              <li><Link to="#" className="text-gray-400 hover:text-white transition-colors text-sm">Historical Preservation</Link></li>
              <li><Link to="#" className="text-gray-400 hover:text-white transition-colors text-sm">Authenticity Guarantee</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-serif mb-4 text-[#7BBDE8]">Support</h4>
            <ul className="space-y-2">
              <li><Link to="#" className="text-gray-400 hover:text-white transition-colors text-sm">Contact Us</Link></li>
              <li><Link to="#" className="text-gray-400 hover:text-white transition-colors text-sm">Shipping & Returns</Link></li>
              <li><Link to="#" className="text-gray-400 hover:text-white transition-colors text-sm">Privacy Policy</Link></li>
              <li><Link to="#" className="text-gray-400 hover:text-white transition-colors text-sm">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Coin India. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0 flex space-x-6">
            <span className="text-gray-500 text-sm">Newsletter</span>
            <div className="flex">
              <input type="email" placeholder="Email Address" className="bg-white/10 text-white px-4 py-1 text-sm outline-none border border-white/20 focus:border-[#7BBDE8] rounded-l-lg" />
              <button className="bg-gradient-to-r from-[#49769F] to-[#7BBDE8] text-white px-4 py-1 text-sm hover:from-[#0A4174] hover:to-[#49769F] transition-all rounded-r-lg">Subscribe</button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
