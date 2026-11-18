import { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { isDark } = useTheme();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await adminService.getUsers();
      setUsers(data.users || (Array.isArray(data) ? data : []));
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    (user.name && user.name.toLowerCase().includes(search.toLowerCase())) ||
    (user.email && user.email.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <div className={`p-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Loading user directory...</div>;

  const cardBg = isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200';

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6">
        <h1 className={`text-xl sm:text-2xl font-serif ${isDark ? 'text-white' : 'text-gray-900'}`}>User Management</h1>
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search users by name or email..."
            className={`w-full px-3 py-2 border rounded-lg text-xs sm:text-sm transition-all focus:outline-none focus:ring-1 focus:ring-gold-500 ${
              isDark ? 'bg-dark-700 border-dark-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
            }`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      
      {/* Mobile User Cards (< sm) */}
      <div className="block sm:hidden space-y-3 mb-6">
        {filteredUsers.length === 0 ? (
          <div className={`p-6 text-center rounded-xl border ${cardBg}`}>
            <p className="text-xs text-gray-500">No matching users found.</p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div key={user._id} className={`p-4 border rounded-xl shadow-sm ${cardBg} space-y-2`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.name}</h3>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</p>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full capitalize ${
                  user.role === 'admin' 
                    ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20' 
                    : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                }`}>
                  {user.role}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 pt-1 border-t border-gray-100 dark:border-dark-700">
                Joined: {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table (>= sm) */}
      <div className={`hidden sm:block border rounded-xl shadow-sm overflow-hidden ${cardBg}`}>
        <div className="overflow-x-auto touch-scroll">
          <table className={`min-w-full divide-y ${isDark ? 'divide-dark-700' : 'divide-gray-200'}`}>
            <thead className={isDark ? 'bg-dark-700/50' : 'bg-gray-50'}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Name</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Email</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Role</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Joined</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-dark-700' : 'divide-gray-200'}`}>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" className={`px-6 py-8 text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    No matching users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className={`transition-colors ${isDark ? 'hover:bg-dark-700/50' : 'hover:bg-gray-50'}`}>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {user.name}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${
                        user.role === 'admin' 
                          ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20' 
                          : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManager;
