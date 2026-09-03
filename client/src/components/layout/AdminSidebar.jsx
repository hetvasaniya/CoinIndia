import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiGrid, FiBox, FiList, FiGlobe, FiTool, 
  FiShoppingBag, FiUsers, FiSettings, FiLogOut, FiPackage,
  FiSun, FiMoon, FiDollarSign, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const AdminSidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('admin_sidebar_collapsed') === 'true';
  });
  const [isHovered, setIsHovered] = useState(false);

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

  return (
    <aside
      className={`relative flex-shrink-0 transition-all duration-300 ${
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
        className={`flex flex-col h-full bg-dark-900 text-white border-r border-dark-700/60 transition-all duration-300 ${
          isCollapsed
            ? isHovered
              ? 'fixed left-0 top-0 bottom-0 z-50 w-64 shadow-2xl'
              : 'w-20'
            : 'w-64'
        }`}
      >
        {/* Header & Logo */}
        <div className={`p-4 border-b border-dark-700/60 flex items-center ${
          isExpanded ? 'justify-between' : 'justify-center flex-col gap-2'
        }`}>
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gold-500/50 shadow-md bg-dark-800 p-0.5 transition-transform group-hover:scale-105 flex-shrink-0">
              <img 
                src="https://res.cloudinary.com/elitehomes/image/upload/v1788148596/nedeqh3gfpeilb1sgiv7.png" 
                alt="CoinIndia Logo" 
                className="w-full h-full object-cover rounded-full" 
              />
            </div>
            {isExpanded && (
              <div className="flex flex-col overflow-hidden whitespace-nowrap">
                <span className="text-base font-serif font-bold text-white tracking-wider">
                  Coin<span className="text-gold-500">India</span>
                </span>
                <span className="text-[9px] text-gold-500/80 uppercase tracking-widest font-semibold">
                  Admin Panel
                </span>
              </div>
            )}
          </Link>

          {/* Toggle Option Button */}
          <button
            onClick={toggleCollapse}
            type="button"
            className="p-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-gray-400 hover:text-gold-400 border border-dark-700 transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <FiChevronRight className="text-lg" /> : <FiChevronLeft className="text-lg" />}
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                title={!isExpanded ? item.name : undefined}
                className={`flex items-center text-sm rounded-lg transition-all duration-200 group ${
                  isExpanded ? 'px-4 py-3' : 'justify-center px-2 py-3'
                } ${
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-gold-500/20 to-gold-500/5 text-gold-400 border-l-2 border-gold-500 shadow-sm'
                    : 'text-gray-400 hover:bg-dark-800 hover:text-white border-l-2 border-transparent'
                }`}
              >
                <span className={`text-lg transition-colors ${
                  isExpanded ? 'mr-3' : ''
                } ${
                  isActive(item.path) ? 'text-gold-500' : 'text-gray-400 group-hover:text-gold-400'
                }`}>
                  {item.icon}
                </span>
                {isExpanded && (
                  <span className="truncate">{item.name}</span>
                )}
              </Link>
            ))}
          </nav>
        </div>

        {/* User Section & Theme Toggle */}
        <div className="p-3 border-t border-dark-700/60 space-y-2">
          {isExpanded ? (
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

              {/* Theme Toggle Switch */}
              <button
                onClick={toggleTheme}
                type="button"
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium rounded-lg border border-dark-700 bg-dark-800/80 hover:bg-dark-700 text-gray-300 transition-colors"
                title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
              >
                <div className="flex items-center space-x-2">
                  {isDark ? <FiSun className="text-amber-400 text-sm" /> : <FiMoon className="text-blue-400 text-sm" />}
                  <span>Theme Mode</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-gold-500/20 text-gold-400 font-semibold uppercase tracking-wider text-[10px]">
                  {isDark ? 'Dark' : 'Light'}
                </span>
              </button>

              <button
                onClick={logout}
                className="flex items-center w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <FiLogOut className="mr-3" />
                Sign Out
              </button>
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
                onClick={toggleTheme}
                type="button"
                className="p-2 rounded-lg border border-dark-700 bg-dark-800 hover:bg-dark-700 text-gray-300 transition-colors"
                title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
              >
                {isDark ? <FiSun className="text-amber-400 text-base" /> : <FiMoon className="text-blue-400 text-base" />}
              </button>

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
    </aside>
  );
};

export default AdminSidebar;
