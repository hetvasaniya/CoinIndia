import { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { formatPrice, getStatusColor } from '../../utils/helpers';
import Loader from '../../components/common/Loader';
import { FiDollarSign, FiBox, FiList, FiTrendingUp } from 'react-icons/fi';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

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
        totalRevenue: 0,
        grossRevenue: 0,
        cancelledOrderAmount: 0,
        refundedAmount: 0,
        netRevenue: 0,
        totalOrders: 0,
        completedOrders: 0,
        pendingOrdersCount: 0,
        cancelledOrdersCount: 0,
        totalCoins: 0,
        totalCategories: 0,
        totalCountries: 0,
        totalMints: 0,
        recentCoins: [],
        recentOrders: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-[#1a1a1a]">Dashboard Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Numismatic marketplace health, net revenue audit, and fulfillment queue.</p>
        </div>
      </div>

      {/* Revenue & Fulfillment Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 border border-gray-200 rounded-sm flex items-center shadow-sm">
          <div className="p-3 rounded-full bg-amber-50 text-[#B8860B] mr-4 border border-amber-100">
            <FiDollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Net Active Revenue</p>
            <p className="text-2xl font-serif text-[#1a1a1a] font-bold">{formatPrice(stats?.netRevenue || 0)}</p>
            <span className="text-[11px] text-gray-400">Gross: {formatPrice(stats?.grossRevenue || 0)}</span>
          </div>
        </div>

        <div className="bg-white p-6 border border-gray-200 rounded-sm flex items-center shadow-sm">
          <div className="p-3 rounded-full bg-red-50 text-red-600 mr-4 border border-red-100">
            <FiDollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-red-600">Cancelled Deductions</p>
            <p className="text-2xl font-serif text-red-700 font-bold">-{formatPrice(stats?.cancelledOrderAmount || 0)}</p>
            <span className="text-[11px] text-red-500">{stats?.cancelledOrdersCount || 0} orders cancelled</span>
          </div>
        </div>

        <div className="bg-white p-6 border border-gray-200 rounded-sm flex items-center shadow-sm">
          <div className="p-3 rounded-full bg-blue-50 text-blue-600 mr-4 border border-blue-100">
            <FiBox className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Orders Placed</p>
            <p className="text-2xl font-serif text-[#1a1a1a]">{stats?.totalOrders || 0}</p>
            <span className="text-[11px] text-green-600 font-medium">{stats?.completedOrders || 0} delivered</span>
          </div>
        </div>

        <div className="bg-white p-6 border border-gray-200 rounded-sm flex items-center shadow-sm">
          <div className="p-3 rounded-full bg-purple-50 text-purple-600 mr-4 border border-purple-100">
            <FiTrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Listed Coins / Stock</p>
            <p className="text-2xl font-serif text-[#1a1a1a]">{stats?.totalCoins || 0}</p>
            <span className="text-[11px] text-gray-400">{stats?.totalCategories || 0} categories</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white border border-gray-200 rounded-sm p-6 shadow-sm">
          <h2 className="text-lg font-serif text-[#1a1a1a] mb-6">Revenue Over Time</h2>
          <div className="h-64 flex items-end justify-between space-x-2 pt-4">
            {[40, 60, 45, 80, 55, 90, 75, 100].map((height, i) => (
              <div key={i} className="w-full flex flex-col items-center">
                <div 
                  className="w-full bg-[#B8860B] rounded-t-sm transition-all duration-500 chart-bar" 
                  style={{ height: `${height}%` }}
                ></div>
                <span className="text-xs text-gray-400 mt-2">W{i+1}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#1a1a1a] border border-gray-800 text-white rounded-sm p-6 shadow-sm">
          <h2 className="text-lg font-serif text-[#B8860B] mb-6">Order Volume</h2>
          <div className="h-64 flex items-end justify-between space-x-2 pt-4">
            {[30, 45, 35, 60, 40, 70, 55, 80].map((height, i) => (
              <div key={i} className="w-full flex flex-col items-center">
                <div 
                  className="w-full bg-[#B8860B] rounded-t-sm transition-all duration-500 chart-bar" 
                  style={{ height: `${height}%` }}
                ></div>
                <span className="text-xs text-gray-400 mt-2">W{i+1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-[#FAFAF7]">
            <h2 className="text-lg font-serif text-[#1a1a1a]">Recent Coins Added</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {(!stats?.recentCoins || stats.recentCoins.length === 0) ? (
              <div className="p-6 text-center text-sm text-gray-500">No coins recorded yet.</div>
            ) : (
              stats.recentCoins.map((coin) => (
                <div key={coin._id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-medium text-sm text-[#1a1a1a]">{coin.name}</p>
                    <p className="text-xs text-gray-500">SKU: {coin.sku || 'N/A'} &middot; {coin.country?.name || coin.era}</p>
                  </div>
                  <p className="text-sm font-medium">{formatPrice(coin.sellingPrice !== undefined ? coin.sellingPrice : coin.price)}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-[#FAFAF7] flex items-center justify-between">
            <h2 className="text-lg font-serif text-[#1a1a1a]">Recent Customer Orders</h2>
            <a href="/admin/orders" className="text-xs text-[#B8860B] font-medium hover:underline">View All Orders &rarr;</a>
          </div>
          <div className="divide-y divide-gray-200">
            {(!stats?.recentOrders || stats.recentOrders.length === 0) ? (
              <div className="p-6 text-center text-sm text-gray-500">No orders placed yet.</div>
            ) : (
              stats.recentOrders.map((order) => (
                <div key={order._id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div>
                    <p className={`font-medium text-sm ${order.status === 'cancelled' ? 'text-red-700 line-through' : 'text-[#1a1a1a]'}`}>
                      Order {order.orderNumber || `#${order._id.substring(order._id.length - 8).toUpperCase()}`}
                    </p>
                    <p className="text-xs text-gray-500">{order.user?.name || 'Customer'} &middot; {new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${order.status === 'cancelled' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{formatPrice(order.totalAmount || 0)}</p>
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
