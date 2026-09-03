import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import orderService from '../../services/orderService';
import { formatPrice, getStatusColor } from '../../utils/helpers';
import Loader from '../../components/common/Loader';
import { FiCheckCircle, FiClock, FiTruck, FiPackage, FiShield } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';

const OrderDetail = () => {
  const { id } = useParams();
  const { isDark } = useTheme();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const data = await orderService.getOrder(id);
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;
  if (!order) return <div className={`text-center py-20 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Order details not found</div>;

  const cardBg = isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200';

  return (
    <div className={`min-h-screen py-12 transition-colors ${isDark ? 'bg-dark-900 text-gray-100' : 'bg-[#FAF8F5] text-gray-900'}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-4 border-b border-gray-500/20">
          <div>
            <span className="text-xs uppercase tracking-widest text-gold-500 font-semibold">Order Summary</span>
            <h1 className={`text-3xl font-serif mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Order #{order.orderNumber || order._id.slice(-8).toUpperCase()}
            </h1>
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Placed on {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <span className={`px-4 py-1.5 text-sm font-semibold rounded-full capitalize ${getStatusColor(order.status)}`}>
              {order.status}
            </span>
          </div>
        </div>

        <div className="space-y-8">
          {/* Order Items */}
          <div className={`border rounded-xl p-6 shadow-sm ${cardBg}`}>
            <h2 className={`text-lg font-serif mb-6 border-b pb-3 ${isDark ? 'text-white border-dark-700' : 'text-gray-900 border-gray-200'}`}>
              Purchased Artifacts
            </h2>
            <div className="divide-y divide-gray-500/10">
              {order.items?.map((item, idx) => (
                <div key={idx} className="py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-16 h-16 rounded-lg p-2 border flex-shrink-0 ${
                      isDark ? 'bg-dark-700 border-dark-600' : 'bg-gray-50 border-gray-200'
                    }`}>
                      {item.coin?.images?.[0] && (
                        <img 
                          src={typeof item.coin.images[0] === 'string' ? item.coin.images[0] : item.coin.images[0].url} 
                          alt={item.coin?.name} 
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>
                    <div>
                      <h3 className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {item.coin?.name || 'Numismatic Coin'}
                      </h3>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Quantity: {item.quantity}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${isDark ? 'text-gold-400' : 'text-gray-900'}`}>
                    {formatPrice((item.price || item.coin?.sellingPrice || 0) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping & Payment Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className={`border rounded-xl p-6 shadow-sm ${cardBg}`}>
              <h3 className={`text-base font-serif mb-4 border-b pb-2 ${isDark ? 'text-white border-dark-700' : 'text-gray-900 border-gray-200'}`}>
                Shipping Address
              </h3>
              <div className={`text-sm space-y-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <p className="font-medium text-gold-500">{order.shippingAddress?.phone}</p>
                <p>{order.shippingAddress?.street}</p>
                <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.zipCode}</p>
                <p>{order.shippingAddress?.country || 'India'}</p>
              </div>
            </div>

            <div className={`border rounded-xl p-6 shadow-sm ${cardBg}`}>
              <h3 className={`text-base font-serif mb-4 border-b pb-2 ${isDark ? 'text-white border-dark-700' : 'text-gray-900 border-gray-200'}`}>
                Payment Breakdown
              </h3>
              <div className={`text-sm space-y-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.totalAmount ? Math.round(order.totalAmount / 1.18) : 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (18%)</span>
                  <span>{formatPrice(order.totalAmount ? Math.round(order.totalAmount - (order.totalAmount / 1.18)) : 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-emerald-500 font-medium">Free</span>
                </div>
                <div className={`flex justify-between pt-3 border-t font-bold text-base ${isDark ? 'border-dark-700 text-white' : 'border-gray-200 text-gray-900'}`}>
                  <span>Total Amount</span>
                  <span className="text-gold-500">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
