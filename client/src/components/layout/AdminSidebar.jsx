import { Link, useLocation } from 'react-router-dom';
import { 
  FiGrid, FiBox, FiList, FiGlobe, FiTool, 
  FiShoppingBag, FiUsers, FiSettings, FiLogOut 
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const AdminSidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: <FiGrid /> },
    { name: 'Coins', path: '/admin/coins', icon: <FiBox /> },
    { name: 'Categories', path: '/admin/categories', icon: <FiList /> },
    { name: 'Countries', path: '/admin/countries', icon: <FiGlobe /> },
    { name: 'Mints', path: '/admin/mints', icon: <FiTool /> },
    { name: 'Orders', path: '/admin/orders', icon: <FiShoppingBag /> },
    { name: 'Users', path: '/admin/users', icon: <FiUsers /> },
    { name: 'Inventory', path: '/admin/inventory', icon: <FiBox /> },
    { name: 'Settings', path: '/admin/settings', icon: <FiSettings /> },
  ];

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="w-64 bg-gradient-to-b from-[#001D39] via-[#0A4174] to-[#49769F] text-white flex flex-col h-full">
      <div className="p-6">
        <Link to="/" className="text-2xl font-serif text-white tracking-wider block text-center">
          Coin<span className="text-[#7BBDE8]">India</span>
        </Link>
        <div className="text-xs text-center text-gray-400 mt-1 uppercase tracking-widest">Admin Panel</div>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center px-4 py-3 text-sm rounded-xl transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-white/20 text-white backdrop-blur-sm shadow-sm'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-[#7BBDE8] font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-gray-400">Administrator</p>
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-white/10 rounded-xl transition-colors"
        >
          <FiLogOut className="mr-3" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
