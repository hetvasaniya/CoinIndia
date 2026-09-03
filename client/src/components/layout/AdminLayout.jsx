import { Outlet, Navigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const AdminLayout = () => {
  const { user, loading } = useAuth();
  const { isDark } = useTheme();

  if (loading) return <div className="flex items-center justify-center h-screen bg-theme-primary text-theme-primary">Loading...</div>;
  if (!user || user.role !== 'admin') return <Navigate to="/login" replace />;

  return (
    <div className={`flex h-screen ${isDark ? 'bg-dark-950 text-gray-100' : 'bg-[#F5F2EE] text-gray-900'}`}>
      <AdminSidebar />
      <div className={`flex-1 overflow-x-hidden overflow-y-auto ${isDark ? 'bg-dark-950' : 'bg-[#F5F2EE]'}`}>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
