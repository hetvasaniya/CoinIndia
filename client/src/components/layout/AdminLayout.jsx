import { useState } from 'react';
import { Outlet, Navigate, Link } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { FiMenu, FiX, FiSun, FiMoon, FiGlobe } from 'react-icons/fi';
import { STATIC_IMAGES } from '../../data/staticImages';

const AdminLayout = () => {
  const { user, loading } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (loading) return <div className="flex items-center justify-center h-screen bg-theme-primary text-theme-primary">Loading...</div>;
  if (!user || user.role !== 'admin') return <Navigate to="/login" replace />;

  return (
    <div className={`flex flex-col md:flex-row h-screen w-full max-w-full overflow-hidden ${isDark ? 'bg-dark-950 text-gray-100' : 'bg-[#F5F2EE] text-gray-900'}`}>
      {/* Mobile Admin Top Navigation Bar */}
      <header className={`md:hidden flex items-center justify-between px-3 sm:px-4 h-16 border-b z-30 flex-shrink-0 transition-colors ${
        isDark ? 'bg-dark-900/95 border-dark-700/80 shadow-md backdrop-blur-md' : 'bg-white/95 border-gray-200 shadow-sm backdrop-blur-md'
      }`}>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className={`p-2 rounded-lg transition-colors focus:outline-none ${
              mobileSidebarOpen ? 'text-gold-500 bg-gold-500/10' : isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'
            }`}
            aria-label="Toggle admin sidebar"
          >
            {mobileSidebarOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
          </button>
          <Link to="/admin" className="flex items-center gap-2">
            <img 
              src={STATIC_IMAGES.logo.main} 
              alt="Coinomart" 
              className="h-8 sm:h-9 w-auto max-w-[110px] sm:max-w-[130px] object-contain rounded" 
            />
            <span className="text-[9px] uppercase font-bold tracking-widest bg-gold-500/20 text-gold-400 border border-gold-500/30 px-1.5 py-0.5 rounded">
              Admin
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            to="/"
            className={`p-2 rounded-lg transition-colors text-xs flex items-center gap-1 font-medium ${
              isDark ? 'text-gray-400 hover:text-gold-400' : 'text-gray-600 hover:text-gold-600'
            }`}
            title="View Public Storefront"
          >
            <FiGlobe className="w-4 h-4" />
            <span className="hidden sm:inline">Store</span>
          </Link>
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-gold-400' : 'text-gray-500 hover:text-gold-600'}`}
            aria-label="Toggle theme"
          >
            {isDark ? <FiSun className="w-4 h-4" /> : <FiMoon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Admin Sidebar */}
      <AdminSidebar 
        mobileOpen={mobileSidebarOpen} 
        setMobileOpen={setMobileSidebarOpen} 
      />

      {/* Main Content Area with responsive scrolling and padding */}
      <div className={`flex-1 overflow-x-hidden overflow-y-auto w-full max-w-full ${isDark ? 'bg-dark-950' : 'bg-[#F5F2EE]'}`}>
        <main className="p-3.5 sm:p-5 md:p-6 lg:p-8 max-w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
