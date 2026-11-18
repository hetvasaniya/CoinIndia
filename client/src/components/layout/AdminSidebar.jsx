import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiGrid, FiBox, FiList, FiGlobe, FiTool, 
  FiShoppingBag, FiUsers, FiSettings, FiLogOut, FiPackage,
  FiDollarSign, FiChevronLeft, FiChevronRight, FiCpu, FiX
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { STATIC_IMAGES } from '../../data/staticImages';

const AdminSidebar = ({ mobileOpen, setMobileOpen }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('admin_sidebar_collapsed') === 'true';
  });
  const [isHovered, setIsHovered] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  }, [location.pathname]);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const nextState = !prev;
      localStorage.setItem('admin_sidebar_collapsed', String(nextState));
      return nextState;
    });
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: <FiGrid /> },
    { name: 'Coins', path: '/admin/coins', icon: <FiBox /> },
    { name: 'Add with AI', path: '/admin/coins/ai', icon: <FiCpu className="text-gold-400" /> },
    { name: 'Categories', path: '/admin/categories', icon: <FiList /> },
    { name: 'Countries', path: '/admin/countries', icon: <FiGlobe /> },
    { name: 'Mints', path: '/admin/mints', icon: <FiTool /> },
    { name: 'Orders', path: '/admin/orders', icon: <FiShoppingBag /> },
    { name: 'Refunds', path: '/admin/refunds', icon: <FiDollarSign /> },
    { name: 'Users', path: '/admin/users', icon: <FiUsers /> },
    { name: 'Inventory', path: '/admin/inventory', icon: <FiPackage /> },
    { name: 'Settings', path: '/admin/settings', icon: <FiSettings /> },
  ];

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  const isExpanded = !isCollapsed || isHovered;

  const renderNavContent = (isMobile = false) => (
    <div className="flex flex-col h-full bg-dark-900 text-white border-r border-dark-700/60">
      {/* Header & Logo */}
      <div className={`p-4 border-b border-dark-700/60 flex items-center ${
        isMobile ? 'justify-between' : isExpanded ? 'justify-between' : 'justify-center flex-col gap-2'
      }`}>
        <Link to="/" className="flex items-center gap-3 group">
          {isMobile || isExpanded ? (
            <div className="flex flex-col">
              <img 
                src={STATIC_IMAGES.logo.main} 
                alt="Coinomart" 
                className="h-10 sm:h-12 w-auto max-w-[140px] sm:max-w-[150px] object-contain rounded transition-transform group-hover:scale-105" 
              />
              <span className="text-[9px] text-gold-500/80 uppercase tracking-widest font-semibold mt-1 pl-1">
                Admin Panel
              </span>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full overflow-hidden border border-gold-500/50 shadow-md bg-dark-800 p-0.5 transition-transform group-hover:scale-105 flex-shrink-0">
              <img 
                src={STATIC_IMAGES.logo.main} 
                alt="Coinomart" 
                className="w-full h-full object-cover rounded-full" 
              />
            </div>
          )}
        </Link>

        {isMobile ? (
          <button
            onClick={() => setMobileOpen(false)}
            type="button"
            className="p-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-gray-400 hover:text-white border border-dark-700"
            aria-label="Close sidebar"
          >
            <FiX className="text-lg" />
          </button>
        ) : (
          <button
            onClick={toggleCollapse}
            type="button"
            className="p-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-gray-400 hover:text-gold-400 border border-dark-700 transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <FiChevronRight className="text-lg" /> : <FiChevronLeft className="text-lg" />}
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              title={!isMobile && !isExpanded ? item.name : undefined}
              className={`flex items-center text-sm rounded-lg transition-all duration-200 group ${
                isMobile || isExpanded ? 'px-4 py-2.5 sm:py-3' : 'justify-center px-2 py-3'
              } ${
                isActive(item.path)
                  ? 'bg-gradient-to-r from-gold-500/20 to-gold-500/5 text-gold-400 border-l-2 border-gold-500 shadow-sm'
                  : 'text-gray-400 hover:bg-dark-800 hover:text-white border-l-2 border-transparent'
              }`}
            >
              <span className={`text-lg transition-colors ${
                isMobile || isExpanded ? 'mr-3' : ''
              } ${
                isActive(item.path) ? 'text-gold-500' : 'text-gray-400 group-hover:text-gold-400'
              }`}>
                {item.icon}
              </span>
              {(isMobile || isExpanded) && (
                <span className="truncate">{item.name}</span>
              )}
            </Link>
          ))}
        </nav>
      </div>

      {/* User Section */}
      <div className="p-3 border-t border-dark-700/60 space-y-2">
        {isMobile || isExpanded ? (
          <>
            <div className="flex items-center justify-between px-1 py-1">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center text-dark-900 font-bold text-sm flex-shrink-0">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="ml-3 overflow-hidden">
                  <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                  <p className="text-[11px] text-gray-400">Administrator</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                to="/"
                className="flex items-center justify-center px-2 py-1.5 text-xs text-gold-400 hover:bg-gold-500/10 border border-gold-500/30 rounded-lg transition-colors"
              >
                Storefront &rarr;
              </Link>
              <button
                onClick={logout}
                className="flex items-center justify-center px-2 py-1.5 text-xs text-red-400 hover:bg-red-500/10 border border-red-500/30 rounded-lg transition-colors"
              >
                <FiLogOut className="mr-1.5" /> Sign Out
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <div
              className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center text-dark-900 font-bold text-sm"
              title={user?.name}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </div>

            <button
              onClick={logout}
              className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
              title="Sign Out"
            >
              <FiLogOut className="text-base" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:block relative flex-shrink-0 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
        onMouseEnter={() => {
          if (isCollapsed) setIsHovered(true);
        }}
        onMouseLeave={() => {
          if (isCollapsed) setIsHovered(false);
        }}
      >
        <div
          className={`h-full transition-all duration-300 ${
            isCollapsed
              ? isHovered
                ? 'fixed left-0 top-0 bottom-0 z-50 w-64 shadow-2xl'
                : 'w-20'
              : 'w-64'
          }`}
        >
          {renderNavContent(false)}
        </div>
      </aside>

      {/* Mobile Sidebar Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-50 animate-fadeIn">
            {renderNavContent(true)}
          </div>
        </div>
      )}
    </>
  );
};

export default AdminSidebar;
