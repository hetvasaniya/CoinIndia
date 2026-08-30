import { Link } from 'react-router-dom';
import { FiSearch, FiUser, FiShoppingCart, FiMenu, FiX } from 'react-icons/fi';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const { cartCount } = useCart();

  return (
    <nav className="fixed w-full z-50 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="text-2xl font-serif text-[#001D39] tracking-wider">
              Coin<span className="text-[#0A4174]">India</span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex space-x-8">
            <Link to="/" className="text-[#3a4a5a] hover:text-[#0A4174] px-3 py-2 text-sm uppercase tracking-widest transition-colors">Home</Link>
            <Link to="/explore" className="text-[#3a4a5a] hover:text-[#0A4174] px-3 py-2 text-sm uppercase tracking-widest transition-colors">Explore</Link>
            <Link to="/about" className="text-[#3a4a5a] hover:text-[#0A4174] px-3 py-2 text-sm uppercase tracking-widest transition-colors">About</Link>
          </div>

          {/* Icons */}
          <div className="hidden md:flex items-center space-x-6">
            <button className="text-[#001D39] hover:text-[#0A4174] transition-colors">
              <FiSearch className="h-5 w-5" />
            </button>
            <div className="relative group cursor-pointer">
              <div className="flex items-center text-[#001D39] hover:text-[#0A4174] transition-colors">
                <FiUser className="h-5 w-5" />
              </div>
              <div className="absolute right-0 w-48 mt-2 py-2 bg-white rounded-xl shadow-lg border border-[#BDD8E9]/30 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right">
                {user ? (
                  <>
                    <div className="px-4 py-2 border-b border-[#BDD8E9]/30 text-sm font-semibold text-[#001D39]">{user.name}</div>
                    <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#EEF5F9]">Profile</Link>
                    <Link to="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#EEF5F9]">Orders</Link>
                    <Link to="/wishlist" className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#EEF5F9]">Wishlist</Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#EEF5F9]">Admin Dashboard</Link>
                    )}
                    <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Logout</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#EEF5F9]">Login</Link>
                    <Link to="/register" className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#EEF5F9]">Register</Link>
                  </>
                )}
              </div>
            </div>
            <Link to="/cart" className="relative text-[#001D39] hover:text-[#0A4174] transition-colors">
              <FiShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-[#0A4174] to-[#49769F] text-white rounded-full h-4 w-4 flex items-center justify-center text-[10px] font-bold">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-[#001D39] focus:outline-none">
              {isOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden bg-white/90 backdrop-blur-xl border-t border-white/20">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/" className="block px-3 py-2 text-base font-medium text-[#3a4a5a] hover:text-[#0A4174]" onClick={() => setIsOpen(false)}>Home</Link>
            <Link to="/explore" className="block px-3 py-2 text-base font-medium text-[#3a4a5a] hover:text-[#0A4174]" onClick={() => setIsOpen(false)}>Explore</Link>
            <Link to="/about" className="block px-3 py-2 text-base font-medium text-[#3a4a5a] hover:text-[#0A4174]" onClick={() => setIsOpen(false)}>About</Link>
            <Link to="/cart" className="block px-3 py-2 text-base font-medium text-[#3a4a5a] hover:text-[#0A4174]" onClick={() => setIsOpen(false)}>Cart ({cartCount})</Link>
            {user ? (
              <>
                <Link to="/profile" className="block px-3 py-2 text-base font-medium text-[#3a4a5a] hover:text-[#0A4174]" onClick={() => setIsOpen(false)}>Profile</Link>
                {user.role === 'admin' && <Link to="/admin" className="block px-3 py-2 text-base font-medium text-[#3a4a5a] hover:text-[#0A4174]" onClick={() => setIsOpen(false)}>Admin</Link>}
                <button onClick={() => { logout(); setIsOpen(false); }} className="block w-full text-left px-3 py-2 text-base font-medium text-red-600">Logout</button>
              </>
            ) : (
              <Link to="/login" className="block px-3 py-2 text-base font-medium text-[#3a4a5a] hover:text-[#0A4174]" onClick={() => setIsOpen(false)}>Login</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
