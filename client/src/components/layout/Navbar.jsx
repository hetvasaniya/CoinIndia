import { Link } from 'react-router-dom';
import { FiSearch, FiUser, FiShoppingCart, FiMenu, FiX, FiSun, FiMoon } from 'react-icons/fi';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { isDark, toggleTheme } = useTheme();

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 border-b ${
      isDark 
        ? 'bg-dark-900/80 backdrop-blur-xl border-dark-700/50 shadow-lg shadow-black/10' 
        : 'bg-white/80 backdrop-blur-xl border-gray-200/50 shadow-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-gold-500/40 shadow-sm flex items-center justify-center bg-dark-800/50 transition-transform group-hover:scale-105">
                <img 
                  src="https://res.cloudinary.com/elitehomes/image/upload/v1788148596/nedeqh3gfpeilb1sgiv7.png" 
                  alt="CoinIndia Logo" 
                  className="w-full h-full object-cover rounded-full" 
                />
              </div>
              <span className="font-serif text-xl font-bold tracking-wider">
                <span className={isDark ? 'text-white' : 'text-gray-900'}>Coin</span>
                <span className="text-gold-500">India</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex space-x-7">
            {['/', '/explore', '/about', '/reviews', '/support'].map((path, i) => {
              const labels = ['Home', 'Explore', 'About', 'Reviews', 'Help & Support'];
              return (
                <Link 
                  key={path}
                  to={path} 
                  className={`px-2.5 py-2 text-sm uppercase tracking-widest transition-colors hover:text-gold-500 ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  {labels[i]}
                </Link>
              );
            })}
          </div>

          {/* Icons */}
          <div className="hidden md:flex items-center space-x-5">
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
              <span className={`absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ${
                isDark ? 'bg-dark-700 text-gray-300' : 'bg-gray-800 text-white'
              }`}>
                {isDark ? 'Light mode' : 'Dark mode'}
              </span>
            </button>

            <button className={`transition-colors hover:text-gold-500 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <FiSearch className="h-5 w-5" />
            </button>

            <div className="relative group cursor-pointer">
              <div className={`flex items-center transition-colors hover:text-gold-500 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <FiUser className="h-5 w-5" />
              </div>
              <div className={`absolute right-0 w-48 mt-2 py-2 rounded-xl shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right ${
                isDark 
                  ? 'bg-dark-800 border-dark-600 shadow-black/30' 
                  : 'bg-white border-gray-200 shadow-gray-200/50'
              }`}>
                {user ? (
                  <>
                    <div className={`px-4 py-2 border-b text-sm font-semibold ${
                      isDark ? 'border-dark-600 text-white' : 'border-gray-100 text-gray-900'
                    }`}>{user.name}</div>
                    {[
                      { to: '/profile', label: 'Profile' },
                      { to: '/orders', label: 'Orders' },
                      { to: '/wishlist', label: 'Wishlist' },
                    ].map(item => (
                      <Link key={item.to} to={item.to} className={`block px-4 py-2 text-sm transition-colors ${
                        isDark ? 'text-gray-300 hover:bg-dark-700 hover:text-gold-400' : 'text-gray-700 hover:bg-gray-50 hover:text-gold-600'
                      }`}>{item.label}</Link>
                    ))}
                    {user.role === 'admin' && (
                      <Link to="/admin" className={`block px-4 py-2 text-sm transition-colors ${
                        isDark ? 'text-gray-300 hover:bg-dark-700 hover:text-gold-400' : 'text-gray-700 hover:bg-gray-50 hover:text-gold-600'
                      }`}>Admin Dashboard</Link>
                    )}
                    <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10">Logout</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className={`block px-4 py-2 text-sm transition-colors ${
                      isDark ? 'text-gray-300 hover:bg-dark-700 hover:text-gold-400' : 'text-gray-700 hover:bg-gray-50 hover:text-gold-600'
                    }`}>Login</Link>
                    <Link to="/register" className={`block px-4 py-2 text-sm transition-colors ${
                      isDark ? 'text-gray-300 hover:bg-dark-700 hover:text-gold-400' : 'text-gray-700 hover:bg-gray-50 hover:text-gold-600'
                    }`}>Register</Link>
                  </>
                )}
              </div>
            </div>

            <Link to="/cart" className={`relative transition-colors hover:text-gold-500 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <FiShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-gold-600 to-gold-400 text-white rounded-full h-4 w-4 flex items-center justify-center text-[10px] font-bold shadow-gold">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-3">
            <button 
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-colors ${isDark ? 'text-gray-400 hover:text-gold-400' : 'text-gray-500 hover:text-gold-600'}`}
              aria-label="Toggle theme"
            >
              {isDark ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
            </button>
            <button onClick={() => setIsOpen(!isOpen)} className={`focus:outline-none ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {isOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className={`md:hidden border-t transition-all ${
          isDark ? 'bg-dark-900/95 backdrop-blur-xl border-dark-700' : 'bg-white/95 backdrop-blur-xl border-gray-200'
        }`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {[
              { to: '/', label: 'Home' },
              { to: '/explore', label: 'Explore' },
              { to: '/about', label: 'About' },
              { to: '/reviews', label: 'Reviews' },
              { to: '/support', label: 'Help & Support' },
              { to: '/cart', label: `Cart (${cartCount})` },
            ].map(item => (
              <Link key={item.to} to={item.to} className={`block px-3 py-2 text-base font-medium transition-colors hover:text-gold-500 ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`} onClick={() => setIsOpen(false)}>{item.label}</Link>
            ))}
            {user ? (
              <>
                <Link to="/profile" className={`block px-3 py-2 text-base font-medium hover:text-gold-500 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} onClick={() => setIsOpen(false)}>Profile</Link>
                {user.role === 'admin' && <Link to="/admin" className={`block px-3 py-2 text-base font-medium hover:text-gold-500 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} onClick={() => setIsOpen(false)}>Admin</Link>}
                <button onClick={() => { logout(); setIsOpen(false); }} className="block w-full text-left px-3 py-2 text-base font-medium text-red-500">Logout</button>
              </>
            ) : (
              <Link to="/login" className={`block px-3 py-2 text-base font-medium hover:text-gold-500 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} onClick={() => setIsOpen(false)}>Login</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
