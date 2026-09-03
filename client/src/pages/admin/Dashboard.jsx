import { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { formatPrice, getStatusColor } from '../../utils/helpers';
import Loader from '../../components/common/Loader';
import { FiDollarSign, FiBox, FiList, FiTrendingUp } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const data = await adminService.getDashboard();
      if (data) {
        setStats({
          totalRevenue: data.totalRevenue || 0,
          grossRevenue: data.grossRevenue || data.totalRevenue || 0,
          cancelledOrderAmount: data.cancelledOrderAmount || 0,
          refundedAmount: data.refundedAmount || 0,
          netRevenue: data.netRevenue !== undefined ? data.netRevenue : data.totalRevenue || 0,
          totalOrders: data.totalOrders !== undefined ? data.totalOrders : 0,
          completedOrders: data.completedOrders !== undefined ? data.completedOrders : 0,
          pendingOrdersCount: data.pendingOrdersCount !== undefined ? data.pendingOrdersCount : 0,
          cancelledOrdersCount: data.cancelledOrdersCount !== undefined ? data.cancelledOrdersCount : 0,
          totalCoins: data.totalCoins !== undefined ? data.totalCoins : 0,
          totalCategories: data.totalCategories !== undefined ? data.totalCategories : 0,
          totalCountries: data.totalCountries !== undefined ? data.totalCountries : 0,
          totalMints: data.totalMints !== undefined ? data.totalMints : 0,
          recentCoins: data.recentCoins || [],
          recentOrders: data.recentOrders || []
        });
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
      setStats({
        totalRevenue: 0, grossRevenue: 0, cancelledOrderAmount: 0, refundedAmount: 0,
        netRevenue: 0, totalOrders: 0, completedOrders: 0, pendingOrdersCount: 0,
        cancelledOrdersCount: 0, totalCoins: 0, totalCategories: 0, totalCountries: 0,
        totalMints: 0, recentCoins: [], recentOrders: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  const cardBg = isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200';

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-serif ${isDark ? 'text-white' : 'text-gray-900'}`}>Dashboard Overview</h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Numismatic marketplace health, net revenue audit, and fulfillment queue.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`p-6 border rounded-xl flex items-center shadow-sm ${cardBg}`}>
          <div className="p-3 rounded-full bg-gold-500/10 text-gold-500 mr-4 border border-gold-500/20">
            <FiDollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gold-500">Net Active Revenue</p>
            <p className={`text-2xl font-serif font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatPrice(stats?.netRevenue || 0)}</p>
            <span className="text-[11px] text-gray-500">Gross: {formatPrice(stats?.grossRevenue || 0)}</span>
          </div>
        </div>

        <div className={`p-6 border rounded-xl flex items-center shadow-sm ${cardBg}`}>
          <div className="p-3 rounded-full bg-red-500/10 text-red-500 mr-4 border border-red-500/20">
            <FiDollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-red-500">Cancelled Deductions</p>
            <p className="text-2xl font-serif text-red-500 font-bold">-{formatPrice(stats?.cancelledOrderAmount || 0)}</p>
            <span className="text-[11px] text-red-400">{stats?.cancelledOrdersCount || 0} orders cancelled</span>
          </div>
        </div>

        <div className={`p-6 border rounded-xl flex items-center shadow-sm ${cardBg}`}>
          <div className="p-3 rounded-full bg-blue-500/10 text-blue-500 mr-4 border border-blue-500/20">
            <FiBox className="w-6 h-6" />
          </div>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Orders Placed</p>
            <p className={`text-2xl font-serif ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats?.totalOrders || 0}</p>
            <span className="text-[11px] text-emerald-500 font-medium">{stats?.completedOrders || 0} delivered</span>
          </div>
        </div>

        <div className={`p-6 border rounded-xl flex items-center shadow-sm ${cardBg}`}>
          <div className="p-3 rounded-full bg-purple-500/10 text-purple-500 mr-4 border border-purple-500/20">
            <FiTrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Listed Coins / Stock</p>
            <p className={`text-2xl font-serif ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats?.totalCoins || 0}</p>
            <span className="text-[11px] text-gray-500">{stats?.totalCategories || 0} categories</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className={`border rounded-xl p-6 shadow-sm ${cardBg}`}>
          <h2 className={`text-lg font-serif mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Revenue Over Time</h2>
          <div className="h-64 flex items-end justify-between space-x-3 pt-6 pb-2">
            {[40, 60, 45, 80, 55, 90, 75, 100].map((height, i) => (
              <div key={i} className="w-full h-full flex flex-col items-center justify-end group relative">
                <div className={`opacity-0 group-hover:opacity-100 absolute -top-8 text-xs py-1 px-2 rounded shadow-md transition-opacity pointer-events-none z-10 ${
                  isDark ? 'bg-dark-600 text-white' : 'bg-gray-800 text-white'
                }`}>
                  ₹{(height * 1500).toLocaleString()}
                </div>
                <div className="w-full flex-1 flex items-end justify-center">
                  <div 
                    className="w-full max-w-[28px] bg-gradient-to-t from-gold-600 via-gold-500 to-gold-400 rounded-t-md transition-all duration-500 hover:brightness-110 shadow-sm" 
                    style={{ height: `${height}%`, minHeight: '4px' }}
                  ></div>
                </div>
                <span className={`text-xs mt-3 font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>W{i+1}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className={`border rounded-xl p-6 shadow-sm ${cardBg}`}>
          <h2 className="text-lg font-serif text-gold-500 mb-6">Order Volume</h2>
          <div className="h-64 flex items-end justify-between space-x-3 pt-6 pb-2">
            {[30, 45, 35, 60, 40, 70, 55, 80].map((height, i) => (
              <div key={i} className="w-full h-full flex flex-col items-center justify-end group relative">
                <div className={`opacity-0 group-hover:opacity-100 absolute -top-8 text-xs py-1 px-2 rounded shadow-md transition-opacity pointer-events-none z-10 ${
                  isDark ? 'bg-dark-600 text-white' : 'bg-gray-800 text-white'
                }`}>
                  {Math.round(height * 0.4)} orders
                </div>
                <div className="w-full flex-1 flex items-end justify-center">
                  <div 
                    className="w-full max-w-[28px] bg-gradient-to-t from-amber-600 via-gold-500 to-amber-400 rounded-t-md transition-all duration-500 hover:brightness-110 shadow-sm" 
                    style={{ height: `${height}%`, minHeight: '4px' }}
                  ></div>
                </div>
                <span className={`text-xs mt-3 font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>W{i+1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className={`border rounded-xl shadow-sm overflow-hidden ${cardBg}`}>
          <div className={`px-6 py-4 border-b ${isDark ? 'border-dark-700 bg-dark-700/50' : 'border-gray-200 bg-gray-50'}`}>
            <h2 className={`text-lg font-serif ${isDark ? 'text-white' : 'text-gray-900'}`}>Recent Coins Added</h2>
          </div>
          <div className="divide-y divide-gray-500/10">
            {(!stats?.recentCoins || stats.recentCoins.length === 0) ? (
              <div className="p-6 text-center text-sm text-gray-500">No coins recorded yet.</div>
            ) : (
              stats.recentCoins.map((coin) => (
                <div key={coin._id} className={`p-4 flex items-center justify-between transition-colors ${isDark ? 'hover:bg-dark-700/50' : 'hover:bg-gray-50'}`}>
                  <div>
                    <p className={`font-medium text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{coin.name}</p>
                    <p className="text-xs text-gray-500">SKU: {coin.sku || 'N/A'} &middot; {coin.country?.name || coin.era}</p>
                  </div>
                  <p className="text-sm font-medium text-gold-500">{formatPrice(coin.sellingPrice !== undefined ? coin.sellingPrice : coin.price)}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={`border rounded-xl shadow-sm overflow-hidden ${cardBg}`}>
          <div className={`px-6 py-4 border-b flex items-center justify-between ${isDark ? 'border-dark-700 bg-dark-700/50' : 'border-gray-200 bg-gray-50'}`}>
            <h2 className={`text-lg font-serif ${isDark ? 'text-white' : 'text-gray-900'}`}>Recent Customer Orders</h2>
            <a href="/admin/orders" className="text-xs text-gold-500 font-medium hover:underline">View All Orders &rarr;</a>
          </div>
          <div className="divide-y divide-gray-500/10">
            {(!stats?.recentOrders || stats.recentOrders.length === 0) ? (
              <div className="p-6 text-center text-sm text-gray-500">No orders placed yet.</div>
            ) : (
              stats.recentOrders.map((order) => (
                <div key={order._id} className={`p-4 flex items-center justify-between transition-colors ${isDark ? 'hover:bg-dark-700/50' : 'hover:bg-gray-50'}`}>
                  <div>
                    <p className={`font-medium text-sm ${order.status === 'cancelled' ? 'text-red-500 line-through' : isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                      Order {order.orderNumber || `#${order._id.substring(order._id.length - 8).toUpperCase()}`}
                    </p>
                    <p className="text-xs text-gray-500">{order.user?.name || 'Customer'} &middot; {new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${order.status === 'cancelled' ? 'text-gray-500 line-through' : 'text-gold-500'}`}>{formatPrice(order.totalAmount || 0)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block capitalize ${getStatusColor(order.status)}`}>
                      {order.status || 'confirmed'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
