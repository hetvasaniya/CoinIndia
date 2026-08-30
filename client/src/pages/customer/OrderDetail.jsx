import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import orderService from '../../services/orderService';
import { formatPrice, formatDate, getImageUrl } from '../../utils/helpers';
import Loader from '../../components/common/Loader';
import { FiCheck } from 'react-icons/fi';

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      const data = await orderService.getOrderById(id);
      setOrder(data.order || data);
    } catch (error) {
      console.error('Failed to fetch order', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;
  if (!order) return <div className="text-center py-20">Order not found</div>;

  const steps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
  const currentStepIndex = Math.max(0, steps.indexOf(order.status?.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <Link to="/orders" className="text-sm text-gray-500 hover:text-[#B8860B] mb-4 inline-block">&larr; Back to Orders</Link>
        <h1 className="text-3xl font-serif text-[#1a1a1a]">Order #{order.orderNumber || order._id.substring(order._id.length - 8).toUpperCase()}</h1>
        <p className="text-gray-500 mt-2">Placed on {formatDate(order.createdAt)}</p>
      </div>

      {/* Timeline Stepper or Cancelled Notice */}
      {order.status?.toLowerCase() === 'cancelled' ? (
        <div className="bg-red-50 border border-red-200 rounded-sm p-6 mb-8 text-red-900 space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full font-bold text-xs uppercase border border-red-300">
              Order Cancelled
            </span>
            {order.cancelledAt && (
              <span className="text-xs text-red-700 font-medium">on {formatDate(order.cancelledAt)}</span>
            )}
          </div>
          <p className="text-sm text-red-800">
            {order.cancellationReason ? `Reason: ${order.cancellationReason}` : 'This order was cancelled.'}
          </p>
          {order.refund?.status && order.refund.status !== 'none' && (
            <div className="mt-3 pt-3 border-t border-red-200 text-xs text-purple-900 bg-purple-50/70 p-3 rounded">
              <span className="font-bold">Refund Details: </span>
              <span>Amount: {formatPrice(order.refund.amount || order.totalAmount)} &middot; Status: <strong className="capitalize">{order.refund.status}</strong> &middot; Method: {order.refund.method || 'Original Payment Method'}</span>
              {order.refund.transactionId && (
                <span className="block mt-1 font-mono text-[11px] text-gray-600">Ref / Txn ID: {order.refund.transactionId}</span>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-8 border border-gray-200 rounded-sm mb-8">
          <div className="relative">
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 rounded"></div>
            <div 
              className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-[#B8860B] transition-all duration-500 rounded"
              style={{ width: `${(Math.max(0, currentStepIndex) / (steps.length - 1)) * 100}%` }}
            ></div>
            
            <div className="relative flex justify-between">
              {steps.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isActive = index === currentStepIndex;
                return (
                  <div key={step} className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center relative z-10 transition-colors ${
                      isCompleted ? 'bg-[#B8860B] text-white' : 'bg-white border-2 border-gray-300 text-gray-300'
                    } ${isActive ? 'ring-4 ring-gold-100' : ''}`}>
                      {isCompleted ? <FiCheck className="w-5 h-5" /> : <span>{index + 1}</span>}
                    </div>
                    <span className={`mt-3 text-sm font-medium capitalize ${isCompleted ? 'text-[#1a1a1a]' : 'text-gray-400'}`}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-sm">
            <h2 className="bg-[#FAFAF7] font-serif text-[#1a1a1a] text-lg px-6 py-4 border-b border-gray-200">
              Items in your order
            </h2>
            <div className="divide-y divide-gray-200 px-6">
              {order.items?.map((item, idx) => (
                <div key={item._id || idx} className="py-6 flex items-center">
                  <div className="w-20 h-20 bg-[#FAFAF7] border border-gray-100 p-2 flex-shrink-0">
                    <img 
                      src={item.coinImage || getImageUrl(item.coin?.images)} 
                      alt={item.coinName || item.coin?.name || 'Coin'} 
                      className="w-full h-full object-contain mix-blend-multiply" 
                    />
                  </div>
                  <div className="ml-6 flex-1">
                    <h3 className="font-serif text-[#1a1a1a] text-lg">
                      {item.coinName || item.coin?.name || 'Coin Item'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-[#1a1a1a]">{formatPrice(item.priceAtPurchase || item.price || 0)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Summary & Addresses */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-sm p-6">
            <h2 className="font-serif text-[#1a1a1a] text-lg mb-4 border-b pb-2">Order Summary</h2>
            <div className="space-y-3 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900">{formatPrice(order.subtotal || order.totalAmount - (order.tax || 0))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">GST Tax (18%)</span>
                <span className="text-gray-900">{formatPrice(order.tax || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-3">
              <span className="font-medium text-[#1a1a1a]">Total</span>
              <span className="font-bold text-lg text-[#1a1a1a]">{formatPrice(order.totalAmount)}</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-sm p-6">
            <h2 className="font-serif text-[#1a1a1a] text-lg mb-4 border-b pb-2">Shipping Address</h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p>{order.shippingAddress.street}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
              <p>{order.shippingAddress.country}</p>
              <p className="pt-2">Phone: {order.shippingAddress.phone}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
