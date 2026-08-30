import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import orderService from '../../services/orderService';
import { formatPrice, formatDate, getStatusColor, getImageUrl } from '../../utils/helpers';
import EmptyState from '../../components/common/EmptyState';
import { FiPackage } from 'react-icons/fi';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await orderService.getOrders();
      setOrders(Array.isArray(data) ? data : (data?.orders || []));
    } catch (error) {
      console.error('Failed to fetch orders', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  if (orders.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <EmptyState 
          title="No Orders Yet" 
          message="You haven't placed any orders with us. Start exploring our collection."
          icon={<FiPackage className="h-12 w-12 text-gray-300" />}
          action={
            <Link to="/explore">
              <Button>Explore Catalog</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-serif text-[#1a1a1a] mb-8">Order History</h1>
      
      <div className="space-y-6">
        {orders.map(order => (
          <div key={order._id} className="bg-white border border-gray-200 rounded-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="bg-[#FAFAF7] px-6 py-4 border-b border-gray-200 flex flex-wrap justify-between items-center gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Order Placed</p>
                <p className="font-medium text-[#1a1a1a]">{formatDate(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                <p className="font-medium text-[#1a1a1a]">{formatPrice(order.totalAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Order #</p>
                <p className="font-medium text-[#1a1a1a]">
                  {order.orderNumber || order._id.substring(order._id.length - 8).toUpperCase()}
                </p>
              </div>
              <div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
              <div>
                <Link to={`/orders/${order._id}`}>
                  <Button variant="outline" size="sm">View Details</Button>
                </Link>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex flex-wrap gap-4">
                {order.items.slice(0, 4).map((item, idx) => (
                  <div key={idx} className="w-20 h-20 bg-[#FAFAF7] border border-gray-100 flex-shrink-0 p-2">
                    <img 
                      src={item.coinImage || getImageUrl(item.coin?.images)} 
                      alt={item.coinName || "Coin"} 
                      className="w-full h-full object-contain mix-blend-multiply" 
                    />
                  </div>
                ))}
                {order.items.length > 4 && (
                  <div className="w-20 h-20 bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-500">
                    +{order.items.length - 4} more
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
