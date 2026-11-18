import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
          recentOrders: data.recentOrders || [],
          dailyAnalytics: data.dailyAnalytics || []
        });
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
      setStats({
        totalRevenue: 0, grossRevenue: 0, cancelledOrderAmount: 0, refundedAmount: 0,
        netRevenue: 0, totalOrders: 0, completedOrders: 0, pendingOrdersCount: 0,
        cancelledOrdersCount: 0, totalCoins: 0, totalCategories: 0, totalCountries: 0,
        totalMints: 0, recentCoins: [], recentOrders: [], dailyAnalytics: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  const cardBg = isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200';

  const dailyData = stats?.dailyAnalytics || [];
  const maxRevenue = Math.max(...dailyData.map(d => d.revenue || 0), 1000);
  const maxOrders = Math.max(...dailyData.map(d => d.orders || 0), 5);
  const total7DayRevenue = dailyData.reduce((acc, curr) => acc + (curr.revenue || 0), 0);
  const total7DayOrders = dailyData.reduce((acc, curr) => acc + (curr.orders || 0), 0);

  return (
    <div className="space-y-6 sm:space-y-8 w-full max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className={`text-xl sm:text-2xl font-serif font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Dashboard Overview
          </h1>
          <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Marketplace health, net revenue audit, and inventory status.
          </p>
        </div>
      </div>

      {/* Stats Grid: 1 col on small, 2 on sm, 4 on lg */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className={`p-4 sm:p-5 border rounded-2xl flex items-center shadow-xs ${cardBg}`}>
          <div className="p-3 rounded-xl bg-gold-500/10 text-gold-500 mr-3.5 border border-gold-500/20 flex-shrink-0">
            <FiDollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gold-500 truncate">Net Active Revenue</p>
            <p className={`text-xl sm:text-2xl font-serif font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {formatPrice(stats?.netRevenue || 0)}
            </p>
            <span className="text-[10px] text-gray-500 block truncate">Gross: {formatPrice(stats?.grossRevenue || 0)}</span>
          </div>
        </div>

        <div className={`p-4 sm:p-5 border rounded-2xl flex items-center shadow-xs ${cardBg}`}>
          <div className="p-3 rounded-xl bg-red-500/10 text-red-500 mr-3.5 border border-red-500/20 flex-shrink-0">
            <FiDollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-red-500 truncate">Cancelled Orders</p>
            <p className="text-xl sm:text-2xl font-serif text-red-500 font-bold truncate">
              -{formatPrice(stats?.cancelledOrderAmount || 0)}
            </p>
            <span className="text-[10px] text-red-400 block truncate">{stats?.cancelledOrdersCount || 0} orders cancelled</span>
          </div>
        </div>

        <div className={`p-4 sm:p-5 border rounded-2xl flex items-center shadow-xs ${cardBg}`}>
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500 mr-3.5 border border-blue-500/20 flex-shrink-0">
            <FiBox className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className={`text-[11px] font-bold uppercase tracking-wider truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Orders</p>
            <p className={`text-xl sm:text-2xl font-serif font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {stats?.totalOrders || 0}
            </p>
            <span className="text-[10px] text-emerald-500 font-medium block truncate">{stats?.completedOrders || 0} delivered</span>
          </div>
        </div>

        <div className={`p-4 sm:p-5 border rounded-2xl flex items-center shadow-xs ${cardBg}`}>
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500 mr-3.5 border border-purple-500/20 flex-shrink-0">
            <FiTrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className={`text-[11px] font-bold uppercase tracking-wider truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Listed Coins</p>
            <p className={`text-xl sm:text-2xl font-serif font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {stats?.totalCoins || 0}
            </p>
            <span className="text-[10px] text-gray-500 block truncate">{stats?.totalCategories || 0} categories</span>
          </div>
        </div>
      </div>

      {/* Dynamic Day-to-Day Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        
        {/* Graph 1: Daily Revenue Trend */}
        <div className={`border rounded-2xl p-4 sm:p-6 shadow-xs overflow-hidden ${cardBg}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
            <div>
              <h2 className={`text-base sm:text-lg font-serif font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Daily Revenue Trend</h2>
              <p className={`text-[11px] sm:text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Last 7 days sales</p>
            </div>
            <span className="text-[11px] sm:text-xs px-2.5 py-1 rounded-full font-bold bg-gold-500/10 text-gold-500 border border-gold-500/20 w-fit">
              7D: {formatPrice(total7DayRevenue)}
            </span>
          </div>

          <div className="h-56 sm:h-64 flex items-end justify-between gap-1 sm:gap-2.5 pt-6 pb-2 overflow-x-hidden">
            {dailyData.map((day, i) => {
              const heightPct = Math.max(Math.round(((day.revenue || 0) / maxRevenue) * 100), (day.revenue > 0 ? 12 : 4));
              return (
                <div key={i} className="flex-1 h-full flex flex-col items-center justify-end group relative min-w-0">
                  {/* Tooltip */}
                  <div className={`opacity-0 group-hover:opacity-100 absolute -top-10 text-[10px] py-1 px-2 rounded shadow-lg transition-all duration-200 pointer-events-none z-20 whitespace-nowrap text-center ${
                    isDark ? 'bg-dark-900 border border-dark-600 text-white' : 'bg-gray-900 text-white'
                  }`}>
                    <p className="font-bold text-gold-400">{formatPrice(day.revenue)}</p>
                    <p className="text-[9px] text-gray-300">{day.label}</p>
                  </div>
                  
                  {/* Bar */}
                  <div className="w-full flex-1 flex items-end justify-center">
                    <div 
                      className={`w-full max-w-[28px] sm:max-w-[34px] rounded-t-md transition-all duration-500 group-hover:scale-105 shadow-xs ${
                        day.revenue > 0 
                          ? 'bg-gradient-to-t from-gold-600 via-gold-500 to-gold-400' 
                          : isDark ? 'bg-dark-700/60' : 'bg-gray-200'
                      }`}
                      style={{ height: `${heightPct}%`, minHeight: '6px' }}
                    />
                  </div>

                  {/* Day Label */}
                  <div className="text-center mt-2.5">
                    <span className={`text-[10px] sm:text-xs block font-semibold truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {day.dayName?.slice(0, 3)}
                    </span>
                    <span className="text-[9px] text-gray-500 block truncate">
                      {day.shortLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Graph 2: Day-to-Day Order Volume */}
        <div className={`border rounded-2xl p-4 sm:p-6 shadow-xs overflow-hidden ${cardBg}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
            <div>
              <h2 className={`text-base sm:text-lg font-serif font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Day-to-Day Order Volume</h2>
              <p className={`text-[11px] sm:text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Last 7 days customer orders</p>
            </div>
            <span className="text-[11px] sm:text-xs px-2.5 py-1 rounded-full font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20 w-fit">
              7D: {total7DayOrders} Orders
            </span>
          </div>

          <div className="h-56 sm:h-64 flex items-end justify-between gap-1 sm:gap-2.5 pt-6 pb-2 overflow-x-hidden">
            {dailyData.map((day, i) => {
              const heightPct = Math.max(Math.round(((day.orders || 0) / maxOrders) * 100), (day.orders > 0 ? 12 : 4));
              return (
                <div key={i} className="flex-1 h-full flex flex-col items-center justify-end group relative min-w-0">
                  {/* Tooltip */}
                  <div className={`opacity-0 group-hover:opacity-100 absolute -top-10 text-[10px] py-1 px-2 rounded shadow-lg transition-all duration-200 pointer-events-none z-20 whitespace-nowrap text-center ${
                    isDark ? 'bg-dark-900 border border-dark-600 text-white' : 'bg-gray-900 text-white'
                  }`}>
                    <p className="font-bold text-blue-400">{day.orders} order{day.orders !== 1 ? 's' : ''}</p>
                    <p className="text-[9px] text-emerald-400">{day.deliveredOrders} delivered</p>
                  </div>
                  
                  {/* Bar */}
                  <div className="w-full flex-1 flex items-end justify-center">
                    <div 
                      className={`w-full max-w-[28px] sm:max-w-[34px] rounded-t-md transition-all duration-500 group-hover:scale-105 shadow-xs ${
                        day.orders > 0 
                          ? 'bg-gradient-to-t from-blue-600 via-indigo-500 to-cyan-400' 
                          : isDark ? 'bg-dark-700/60' : 'bg-gray-200'
                      }`}
                      style={{ height: `${heightPct}%`, minHeight: '6px' }}
                    />
                  </div>

                  {/* Day Label */}
                  <div className="text-center mt-2.5">
                    <span className={`text-[10px] sm:text-xs block font-semibold truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {day.dayName?.slice(0, 3)}
                    </span>
                    <span className="text-[9px] text-gray-500 block truncate">
                      {day.shortLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
        
        {/* Recent Coins */}
        <div className={`border rounded-2xl shadow-xs overflow-hidden ${cardBg}`}>
          <div className={`px-4 sm:px-6 py-3.5 border-b ${isDark ? 'border-dark-700 bg-dark-750' : 'border-gray-200 bg-gray-50'}`}>
            <h2 className={`text-base font-serif font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Recent Coins Added</h2>
          </div>
          <div className="divide-y divide-gray-500/10">
            {(!stats?.recentCoins || stats.recentCoins.length === 0) ? (
              <div className="p-6 text-center text-xs sm:text-sm text-gray-500">No coins recorded yet.</div>
            ) : (
              stats.recentCoins.map((coin) => (
                <div key={coin._id} className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 transition-colors ${
                  isDark ? 'hover:bg-dark-700/50' : 'hover:bg-gray-50'
                }`}>
                  <div className="min-w-0">
                    <p className={`font-medium text-xs sm:text-sm truncate ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{coin.name}</p>
                    <p className="text-[11px] text-gray-500 truncate">SKU: {coin.sku || 'N/A'} &middot; {coin.country?.name || coin.era}</p>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-gold-500 whitespace-nowrap">
                    {formatPrice(coin.sellingPrice !== undefined ? coin.sellingPrice : coin.price)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className={`border rounded-2xl shadow-xs overflow-hidden ${cardBg}`}>
          <div className={`px-4 sm:px-6 py-3.5 border-b flex items-center justify-between ${isDark ? 'border-dark-700 bg-dark-750' : 'border-gray-200 bg-gray-50'}`}>
            <h2 className={`text-base font-serif font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Recent Customer Orders</h2>
            <Link to="/admin/orders" className="text-xs text-gold-500 font-bold hover:underline">View All &rarr;</Link>
          </div>
          <div className="divide-y divide-gray-500/10">
            {(!stats?.recentOrders || stats.recentOrders.length === 0) ? (
              <div className="p-6 text-center text-xs sm:text-sm text-gray-500">No orders placed yet.</div>
            ) : (
              stats.recentOrders.map((order) => (
                <div key={order._id} className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 transition-colors ${
                  isDark ? 'hover:bg-dark-700/50' : 'hover:bg-gray-50'
                }`}>
                  <div className="min-w-0">
                    <p className={`font-medium text-xs sm:text-sm truncate ${order.status === 'cancelled' ? 'text-red-500 line-through' : isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                      Order {order.orderNumber || `#${order._id.substring(order._id.length - 8).toUpperCase()}`}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate">{order.user?.name || 'Customer'} &middot; {new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1">
                    <p className={`text-xs sm:text-sm font-bold ${order.status === 'cancelled' ? 'text-gray-500 line-through' : 'text-gold-500'}`}>
                      {formatPrice(order.totalAmount || 0)}
                    </p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-semibold ${getStatusColor(order.status)}`}>
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
