import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import orderService from '../../services/orderService';
import { formatPrice, getStatusColor, formatDate } from '../../utils/helpers';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { FiPackage, FiChevronRight, FiTruck, FiCalendar, FiCheckCircle } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await orderService.getMyOrders();
      setOrders(Array.isArray(data) ? data : (data?.orders || []));
    } catch (error) {
      console.error('Error fetching orders', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  const cardBg = isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200';

  return (
    <div className={`min-h-screen py-6 sm:py-12 transition-colors ${isDark ? 'bg-dark-900 text-gray-100' : 'bg-[#FAF8F5] text-gray-900'}`}>
      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-2">
          <h1 className={`text-2xl sm:text-3xl font-serif font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Order History
          </h1>
          <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {orders.length} {orders.length === 1 ? 'order' : 'orders'} placed
          </p>
        </div>

        {orders.length === 0 ? (
          <EmptyState 
            title="No Orders Placed Yet" 
            message="You haven't purchased any numismatic artifacts yet."
            icon={<FiPackage className={`h-12 w-12 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />}
            action={<Link to="/explore" className="text-gold-500 hover:underline text-sm font-semibold">Explore Coins &rarr;</Link>}
          />
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {orders.map((order) => {
              const isDelivered = order.status?.toLowerCase() === 'delivered';
              const hasTracking = order.trackingNumber || order.carrier || order.estimatedDelivery;

              return (
                <div key={order._id} className={`border rounded-2xl p-4 sm:p-6 shadow-xs transition-all card-hover ${cardBg}`}>
                  {/* Order Summary Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 mb-3 border-gray-500/20 gap-2">
                    <div>
                      <span className="text-xs uppercase tracking-widest text-gold-500 font-bold">
                        Order #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                      </span>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Placed on {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full capitalize ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                      <span className={`text-sm sm:text-base font-bold ${isDark ? 'text-gold-400' : 'text-gray-900'}`}>
                        {formatPrice(order.totalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="divide-y divide-gray-500/10 mb-3">
                    {order.items?.map((item, i) => (
                      <div key={i} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center space-x-2.5">
                          <span className={`text-xs sm:text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                            {item.coin?.name || item.coinName || 'Artifact Specimen'}
                          </span>
                          <span className="text-xs text-gray-500">x{item.quantity}</span>
                        </div>
                        <span className={`text-xs sm:text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {formatPrice(item.priceAtPurchase || item.price || item.coin?.sellingPrice || 0)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Courier & Tracking Quick Preview Bar */}
                  {hasTracking && (
                    <div className={`p-2.5 sm:p-3 rounded-xl border mb-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                      isDark ? 'bg-dark-750/70 border-dark-600' : 'bg-[#FAFAF7] border-gray-200'
                    }`}>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1.5 font-medium">
                          <FiTruck className="text-gold-500 w-3.5 h-3.5 flex-shrink-0" />
                          <span>{order.carrier || 'BlueDart / IndiaPost'}</span>
                        </div>
                        {order.trackingNumber && (
                          <div className="flex items-center gap-1 font-mono">
                            <span className="text-gray-500">AWB:</span>
                            <span className="font-bold text-gold-500">{order.trackingNumber}</span>
                          </div>
                        )}
                      </div>

                      {order.estimatedDelivery && (
                        <div className="flex items-center gap-1.5 text-gray-400">
                          {isDelivered ? (
                            <span className="text-emerald-500 font-semibold inline-flex items-center gap-1">
                              <FiCheckCircle className="w-3.5 h-3.5" /> Delivered
                            </span>
                          ) : (
                            <>
                              <FiCalendar className="w-3.5 h-3.5 text-gold-500" />
                              <span>Est: {new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer Link */}
                  <div className="flex justify-end pt-1">
                    <Link 
                      to={`/orders/${order._id}`} 
                      className="inline-flex items-center text-xs font-bold text-gold-500 hover:text-gold-400 uppercase tracking-wider group py-1"
                    >
                      View Order & Tracking Details <FiChevronRight className="ml-1 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
