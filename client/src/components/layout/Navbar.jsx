import { Link, useNavigate } from 'react-router-dom';
import { 
  FiSearch, FiUser, FiShoppingCart, FiMenu, FiX, 
  FiSun, FiMoon, FiHeart, FiPackage, FiLogOut, FiArrowRight 
} from 'react-icons/fi';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useTheme } from '../../context/ThemeContext';
import { STATIC_IMAGES } from '../../data/staticImages';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { wishlist = [] } = useWishlist();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const wishlistCount = Array.isArray(wishlist) ? wishlist.length : 0;

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Focus search input when search bar opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Close menus on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/explore', label: 'Explore' },
    { to: '/about', label: 'About' },
    { to: '/reviews', label: 'Reviews' },
    { to: '/support', label: 'Help & Support' },
  ];

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 border-b ${
      isDark 
        ? 'bg-dark-900/90 backdrop-blur-xl border-dark-700/60 shadow-lg shadow-black/20' 
        : 'bg-white/90 backdrop-blur-xl border-gray-200/70 shadow-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center group py-1" onClick={() => setIsOpen(false)}>
              <img 
                src={STATIC_IMAGES.logo.main} 
                alt="Coinomart" 
                className="h-10 sm:h-14 w-auto max-w-[125px] sm:max-w-[160px] object-contain rounded transition-transform group-hover:scale-105" 
              />
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex space-x-5 lg:space-x-7">
            {navLinks.map((item) => (
              <Link 
                key={item.to}
                to={item.to} 
                className={`px-2 py-2 text-xs xl:text-sm uppercase tracking-widest font-medium transition-colors hover:text-gold-500 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop Right Action Icons */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-5">
            {/* Search Toggle */}
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`p-2 rounded-full transition-colors hover:text-gold-500 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
              aria-label="Toggle search"
              title="Search coins"
            >
              <FiSearch className="h-5 w-5" />
            </button>

            {/* Wishlist Link */}
            <Link 
              to="/wishlist" 
              className={`relative p-2 rounded-full transition-colors hover:text-gold-500 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
              title="Saved Wishlist"
              aria-label="Wishlist"
            >
              <FiHeart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 bg-gradient-to-r from-red-600 to-rose-500 text-white rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center text-[10px] font-bold shadow-sm">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Link */}
            <Link 
              to="/cart" 
              className={`relative p-2 rounded-full transition-colors hover:text-gold-500 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
              title="Shopping Cart"
              aria-label="Shopping Cart"
            >
              <FiShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-gradient-to-r from-gold-600 to-gold-400 text-white rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center text-[10px] font-bold shadow-gold">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className={`relative p-2 rounded-full transition-all duration-300 group ${
                isDark 
                  ? 'hover:bg-gold-500/10 text-gray-400 hover:text-gold-400' 
                  : 'hover:bg-gold-500/10 text-gray-500 hover:text-gold-600'
              }`}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <div className="relative w-5 h-5">
                <FiSun className={`h-5 w-5 absolute inset-0 transition-all duration-500 ${
                  isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
                }`} />
                <FiMoon className={`h-5 w-5 absolute inset-0 transition-all duration-500 ${
                  isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
                }`} />
              </div>
            </button>

            {/* User Account Dropdown */}
            <div className="relative group cursor-pointer">
              <div className={`p-2 rounded-full flex items-center transition-colors hover:text-gold-500 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <FiUser className="h-5 w-5" />
              </div>
              <div className={`absolute right-0 w-52 mt-2 py-2 rounded-xl shadow-xl border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50 ${
                isDark 
                  ? 'bg-dark-800 border-dark-600 shadow-black/40' 
                  : 'bg-white border-gray-200 shadow-gray-200/60'
              }`}>
                {user ? (
                  <>
                    <div className={`px-4 py-2.5 border-b text-sm ${
                      isDark ? 'border-dark-700 text-white' : 'border-gray-100 text-gray-900'
                    }`}>
                      <p className="font-semibold truncate">{user.name}</p>
                      <p className="text-xs text-gold-500 truncate">{user.email}</p>
                    </div>
                    {[
                      { to: '/profile', label: 'My Profile' },
                      { to: '/orders', label: 'My Orders' },
                      { to: '/wishlist', label: 'Wishlist' },
                      { to: '/payments', label: 'Payment History' },
                    ].map(item => (
                      <Link 
                        key={item.to} 
                        to={item.to} 
                        className={`block px-4 py-2 text-sm transition-colors ${
                          isDark ? 'text-gray-300 hover:bg-dark-700 hover:text-gold-400' : 'text-gray-700 hover:bg-gray-50 hover:text-gold-600'
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                    {user.role === 'admin' && (
                      <Link 
                        to="/admin" 
                        className={`block px-4 py-2 text-sm font-semibold transition-colors ${
                          isDark ? 'text-gold-400 hover:bg-dark-700' : 'text-gold-600 hover:bg-gold-50'
                        }`}
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <button 
                      onClick={logout} 
                      className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link 
                      to="/login" 
                      className={`block px-4 py-2 text-sm font-medium transition-colors ${
                        isDark ? 'text-gray-300 hover:bg-dark-700 hover:text-gold-400' : 'text-gray-700 hover:bg-gray-50 hover:text-gold-600'
                      }`}
                    >
                      Login
                    </Link>
                    <Link 
                      to="/register" 
                      className={`block px-4 py-2 text-sm font-medium transition-colors ${
                        isDark ? 'text-gray-300 hover:bg-dark-700 hover:text-gold-400' : 'text-gray-700 hover:bg-gray-50 hover:text-gold-600'
                      }`}
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Right Action Bar: Compact icons + Hamburger */}
          <div className="flex md:hidden items-center space-x-1 sm:space-x-2">
            {/* Mobile Search Button */}
            <button 
              onClick={() => {
                setIsSearchOpen(!isSearchOpen);
                if (isOpen) setIsOpen(false);
              }}
              className={`p-2 rounded-lg transition-colors ${
                isSearchOpen ? 'text-gold-500 bg-gold-500/10' : isDark ? 'text-gray-300' : 'text-gray-700'
              }`}
              aria-label="Search"
            >
              <FiSearch className="h-5 w-5" />
            </button>

            {/* Mobile Wishlist Button */}
            <Link 
              to="/wishlist" 
              className={`relative p-2 rounded-lg transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
              aria-label="Wishlist"
              onClick={() => setIsOpen(false)}
            >
              <FiHeart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 bg-gradient-to-r from-red-600 to-rose-500 text-white rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center text-[10px] font-bold">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Mobile Cart Button */}
            <Link 
              to="/cart" 
              className={`relative p-2 rounded-lg transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
              aria-label="Cart"
              onClick={() => setIsOpen(false)}
            >
              <FiShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-gradient-to-r from-gold-600 to-gold-400 text-white rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center text-[10px] font-bold">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Mobile Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-gold-400' : 'text-gray-500 hover:text-gold-600'}`}
              aria-label="Toggle theme"
            >
              {isDark ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
            </button>

            {/* Mobile Hamburger Toggle Button */}
            <button 
              onClick={() => {
                setIsOpen(!isOpen);
                if (isSearchOpen) setIsSearchOpen(false);
              }} 
              className={`p-2 rounded-lg focus:outline-none transition-colors ${
                isOpen ? 'text-gold-500 bg-gold-500/10' : isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'
              }`}
              aria-label="Toggle menu"
              aria-expanded={isOpen}
            >
              {isOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Expandable Quick Search Bar (for Desktop & Mobile) */}
        {isSearchOpen && (
          <div className={`py-3 px-1 border-t transition-all duration-200 ${
            isDark ? 'border-dark-700/60 bg-dark-900/95' : 'border-gray-200/80 bg-white/95'
          }`}>
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-3xl mx-auto">
              <div className="relative flex-1">
                <FiSearch className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search coins by ruler, era, mint, or metal..."
                  className={`w-full pl-10 pr-4 py-2 text-sm rounded-lg border transition-colors outline-none ${
                    isDark 
                      ? 'bg-dark-800 border-dark-600 text-white placeholder-gray-500 focus:border-gold-500' 
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gold-500'
                  }`}
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-gold-600 to-gold-500 text-white text-sm font-semibold rounded-lg hover:from-gold-500 hover:to-gold-400 transition-all shadow-sm"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className={`p-2 rounded-lg text-sm ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                aria-label="Close search"
              >
                <FiX className="h-5 w-5" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className={`md:hidden border-t min-h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-y-auto transition-all shadow-2xl ${
          isDark 
            ? 'bg-dark-900 border-dark-700 text-gray-200' 
            : 'bg-[#FAF8F5] border-gray-200 text-gray-800'
        }`}>
          <div className="p-4 sm:p-6 space-y-6">
            {/* Mobile In-Drawer Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search coins, rulers, dynasties..."
                className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border outline-none ${
                  isDark ? 'bg-dark-800 border-dark-600 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                }`}
              />
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <button 
                type="submit" 
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gold-500 hover:text-gold-400"
                aria-label="Submit search"
              >
                <FiArrowRight className="h-4 w-4" />
              </button>
            </form>

            {/* User Account State Card */}
            {user ? (
              <div className={`p-4 rounded-xl border ${
                isDark ? 'bg-dark-800/80 border-dark-700' : 'bg-white border-gray-200 shadow-sm'
              }`}>
                <div className="flex items-center space-x-3 mb-3 pb-3 border-b border-gray-500/20">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-500 to-gold-700 text-dark-950 font-bold flex items-center justify-center text-base flex-shrink-0">
                    {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`font-semibold text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.name || 'User'}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                  {user.role === 'admin' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gold-500/10 text-gold-400 border border-gold-500/30">
                      Admin
                    </span>
                  )}
                </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Link
                      to="/profile"
                      onClick={() => setIsOpen(false)}
                      className={`p-2.5 rounded-lg border text-center font-medium transition-colors ${
                        isDark ? 'bg-dark-700 border-dark-600 text-gray-200 hover:border-gold-500' : 'bg-white border-gray-200 text-gray-700 hover:border-gold-500'
                      }`}
                    >
                      My Profile
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setIsOpen(false)}
                      className={`p-2.5 rounded-lg border text-center font-medium transition-colors ${
                        isDark ? 'bg-dark-700 border-dark-600 text-gray-200 hover:border-gold-500' : 'bg-white border-gray-200 text-gray-700 hover:border-gold-500'
                      }`}
                    >
                      My Orders
                    </Link>
                    <Link
                      to="/wishlist"
                      onClick={() => setIsOpen(false)}
                      className={`p-2.5 rounded-lg border text-center font-medium transition-colors ${
                        isDark ? 'bg-dark-700 border-dark-600 text-gray-200 hover:border-gold-500' : 'bg-white border-gray-200 text-gray-700 hover:border-gold-500'
                      }`}
                    >
                      Saved ({wishlistCount})
                    </Link>
                    <Link
                      to="/payments"
                      onClick={() => setIsOpen(false)}
                      className={`p-2.5 rounded-lg border text-center font-medium transition-colors ${
                        isDark ? 'bg-dark-700 border-dark-600 text-gray-200 hover:border-gold-500' : 'bg-white border-gray-200 text-gray-700 hover:border-gold-500'
                      }`}
                    >
                      Payments
                    </Link>
                  </div>

                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setIsOpen(false)}
                      className="mt-2 block w-full text-center py-2 text-xs font-bold uppercase tracking-wider rounded-lg bg-gold-500/20 text-gold-400 border border-gold-500/30 hover:bg-gold-500/30 transition-colors"
                    >
                      Admin Dashboard &rarr;
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="w-full text-center py-2.5 px-4 rounded-xl border border-gold-500 text-gold-500 font-semibold text-sm hover:bg-gold-500/10 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsOpen(false)}
                    className="w-full text-center py-2.5 px-4 rounded-xl bg-gradient-to-r from-gold-600 to-gold-500 text-white font-semibold text-sm hover:from-gold-500 hover:to-gold-400 shadow-sm transition-all"
                  >
                    Register
                  </Link>
                </div>
              )}

              {/* Navigation Links */}
              <div className="space-y-1">
                <p className={`text-[10px] uppercase font-bold tracking-widest px-3 mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Navigation
                </p>
                {navLinks.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-colors ${
                      isDark ? 'text-gray-200 hover:bg-dark-800 hover:text-gold-400' : 'text-gray-700 hover:bg-gray-100 hover:text-gold-600'
                    }`}
                  >
                    <span>{item.label}</span>
                    <FiArrowRight className="h-4 w-4 opacity-50" />
                  </Link>
                ))}

                <Link
                  to="/cart"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isDark ? 'text-gray-200 hover:bg-dark-800 hover:text-gold-400' : 'text-gray-700 hover:bg-gray-100 hover:text-gold-600'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <FiShoppingCart className="h-4 w-4" />
                    <span>Shopping Cart</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gold-500/20 text-gold-500">
                    {cartCount}
                  </span>
                </Link>
              </div>

              {/* Sign out link if logged in */}
              {user && (
                <div className="pt-2 border-t border-gray-500/20">
                  <button
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                  >
                    <FiLogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
    </nav>
  );
};

export default Navbar;
