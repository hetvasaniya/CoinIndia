import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import orderService from '../../services/orderService';
import { formatPrice, getStatusColor } from '../../utils/helpers';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { FiPackage, FiChevronRight } from 'react-icons/fi';
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

  return (
    <div className={`min-h-screen py-12 transition-colors ${isDark ? 'bg-dark-900 text-gray-100' : 'bg-[#FAF8F5] text-gray-900'}`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className={`text-3xl font-serif mb-8 ${isDark ? 'text-white' : 'text-gray-900'}`}>Order History</h1>

        {orders.length === 0 ? (
          <EmptyState 
            title="No Orders Placed" 
            message="You haven't purchased any numismatic artifacts yet."
            icon={<FiPackage className={`h-12 w-12 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />}
            action={<Link to="/explore" className="text-gold-500 hover:underline">Explore Coins</Link>}
          />
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order._id} className={`border rounded-xl p-6 shadow-sm transition-all card-hover ${
                isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 mb-4 border-gray-500/20">
                  <div>
                    <span className="text-xs uppercase tracking-widest text-gold-500 font-semibold">
                      Order #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                    </span>
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Placed on {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="mt-2 sm:mt-0 flex items-center space-x-3">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <span className={`text-base font-bold ${isDark ? 'text-gold-400' : 'text-gray-900'}`}>
                      {formatPrice(order.totalAmount)}
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-gray-500/10 mb-4">
                  {order.items?.map((item, i) => (
                    <div key={i} className="py-3 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                          {item.coin?.name || 'Artifact'}
                        </span>
                        <span className="text-xs text-gray-500">x{item.quantity}</span>
                      </div>
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {formatPrice(item.price || item.coin?.sellingPrice || 0)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end">
                  <Link 
                    to={`/orders/${order._id}`} 
                    className="inline-flex items-center text-xs font-semibold text-gold-500 hover:text-gold-400 uppercase tracking-wider group"
                  >
                    View Order Details <FiChevronRight className="ml-1 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
