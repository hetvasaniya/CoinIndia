import { Outlet, Navigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { useAuth } from '../../context/AuthContext';

const AdminLayout = () => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user || user.role !== 'admin') return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen bg-[#EEF5F9]">
      <AdminSidebar />
      <div className="flex-1 overflow-x-hidden overflow-y-auto bg-[#EEF5F9]">
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
