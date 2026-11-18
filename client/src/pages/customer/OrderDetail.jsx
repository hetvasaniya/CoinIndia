import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import orderService from '../../services/orderService';
import { formatPrice, formatDate, getStatusColor } from '../../utils/helpers';
import Loader from '../../components/common/Loader';
import { 
  FiCheckCircle, FiClock, FiTruck, FiPackage, FiShield, 
  FiCopy, FiCheck, FiCalendar, FiAlertCircle, FiLock, FiArrowLeft
} from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';

const OrderDetail = () => {
  const { id } = useParams();
  const { isDark } = useTheme();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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

  const handleCopyTracking = (trackingNum) => {
    if (!trackingNum) return;
    navigator.clipboard.writeText(trackingNum);
    setCopied(true);
    toast.success('Tracking number copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <Loader fullScreen />;
  if (!order) return (
    <div className={`min-h-[50vh] flex flex-col items-center justify-center p-6 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
      <h2 className="text-xl font-serif mb-2">Order details not found</h2>
      <Link to="/orders" className="text-gold-500 hover:underline text-sm font-semibold mt-2">
        &larr; Back to Order History
      </Link>
    </div>
  );

  const cardBg = isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200';
  const stepsOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
  const currentStepIdx = stepsOrder.indexOf(order.status?.toLowerCase());
  const isCancelled = order.status?.toLowerCase() === 'cancelled';
  const isDelivered = order.status?.toLowerCase() === 'delivered';

  return (
    <div className={`min-h-screen py-6 sm:py-12 transition-colors ${isDark ? 'bg-dark-900 text-gray-100' : 'bg-[#FAF8F5] text-gray-900'}`}>
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Back Link & Header */}
        <div className="mb-6">
          <Link to="/orders" className="inline-flex items-center text-xs font-bold text-gold-500 hover:text-gold-400 uppercase tracking-wider mb-3">
            <FiArrowLeft className="mr-1.5" /> Back to Orders
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-500/20 gap-3">
            <div>
              <span className="text-xs uppercase tracking-widest text-gold-500 font-bold">Order Summary</span>
              <h1 className={`text-2xl sm:text-3xl font-serif font-bold mt-0.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Order {order.orderNumber || `#${order._id.slice(-8).toUpperCase()}`}
              </h1>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>
            <div>
              <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 ${getStatusColor(order.status)}`}>
                {isDelivered && <FiCheckCircle className="w-3.5 h-3.5" />}
                {isCancelled && <FiAlertCircle className="w-3.5 h-3.5" />}
                {order.status}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {/* ========================================================================= */}
          {/* 1. COURIER & DELIVERY TRACKING SECTION */}
          {/* ========================================================================= */}
          <div className={`border rounded-2xl p-4 sm:p-6 shadow-xs ${cardBg}`}>
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 sm:mb-6 border-b gap-2 ${
              isDark ? 'border-dark-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-gold-500/10 text-gold-500 border border-gold-500/20">
                  <FiTruck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className={`text-base sm:text-lg font-serif font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Consignment Dispatch & Tracking
                  </h2>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Real-time consignment dispatch and transit status.
                  </p>
                </div>
              </div>
            </div>

            {/* Stepper Progress Bar */}
            {isCancelled ? (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs sm:text-sm flex items-center gap-2 mb-6">
                <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>This order was cancelled. Restocked into inventory catalog.</span>
              </div>
            ) : (
              <div className="mb-6 pt-2 pb-4 overflow-x-auto">
                <div className="flex items-center justify-between relative min-w-[280px]">
                  <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 ${isDark ? 'bg-dark-700' : 'bg-gray-200'}`}></div>
                  {['Placed', 'Confirmed', 'Processing', 'Shipped', 'Delivered'].map((step, idx) => {
                    const isDone = idx <= currentStepIdx;
                    const isCurrent = idx === currentStepIdx;

                    return (
                      <div key={step} className="flex flex-col items-center relative z-10 px-1">
                        <div
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isDone
                              ? 'bg-gold-500 text-dark-950 ring-2 ring-gold-500/40 shadow-xs'
                              : isDark
                              ? 'bg-dark-700 border-2 border-dark-600 text-gray-500'
                              : 'bg-white border-2 border-gray-300 text-gray-400'
                          } ${isCurrent ? 'scale-110 ring-4 ring-gold-500/30' : ''}`}
                        >
                          {isDone ? (
                            <FiCheck className="w-3.5 h-3.5 stroke-[3]" />
                          ) : (
                            idx + 1
                          )}
                        </div>
                        <span className={`text-[9px] min-[360px]:text-[10px] sm:text-xs mt-1.5 capitalize font-medium text-center ${
                          isDone 
                            ? isDark ? 'text-gold-400 font-semibold' : 'text-gray-900 font-semibold' 
                            : 'text-gray-400'
                        }`}>
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Courier Details Grid */}
            <div className={`p-3.5 sm:p-4 rounded-xl border ${
              isDark ? 'bg-dark-750/70 border-dark-600' : 'bg-[#FAFAF7] border-gray-200'
            }`}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-500/10">
                {/* 1. Carrier */}
                <div className="pt-2 sm:pt-0">
                  <span className={`text-[11px] uppercase tracking-wider font-semibold block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Carrier Partner
                  </span>
                  <p className={`text-xs sm:text-sm font-semibold mt-1 flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <FiTruck className="text-gold-500 flex-shrink-0" />
                    {order.carrier || 'BlueDart / IndiaPost'}
                  </p>
                  <span className="text-[10px] text-gray-500 block mt-0.5">Insured Numismatic Transit</span>
                </div>

                {/* 2. Tracking Number */}
                <div className="pt-3 sm:pt-0 sm:pl-4">
                  <span className={`text-[11px] uppercase tracking-wider font-semibold block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Tracking / AWB
                  </span>
                  {order.trackingNumber ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs sm:text-sm font-mono font-bold text-gold-500 select-all">
                        {order.trackingNumber}
                      </span>
                      <button
                        onClick={() => handleCopyTracking(order.trackingNumber)}
                        className={`p-1 rounded-md transition-colors ${
                          isDark ? 'bg-dark-700 text-gray-300 hover:text-white' : 'bg-gray-200 text-gray-700 hover:text-gray-900'
                        }`}
                        title="Copy Tracking Number"
                        aria-label="Copy tracking number"
                      >
                        {copied ? <FiCheck className="w-3.5 h-3.5 text-emerald-500" /> : <FiCopy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ) : (
                    <p className={`text-xs mt-1 italic ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {order.status === 'delivered' ? 'Completed' : 'Generated upon dispatch'}
                    </p>
                  )}
                </div>

                {/* 3. Estimated Delivery */}
                <div className="pt-3 sm:pt-0 sm:pl-4">
                  <span className={`text-[11px] uppercase tracking-wider font-semibold block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {isDelivered ? 'Delivery Status' : 'Estimated Delivery'}
                  </span>
                  <p className={`text-xs sm:text-sm font-semibold mt-1 flex items-center gap-1.5 ${
                    isDelivered 
                      ? 'text-emerald-500' 
                      : isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {isDelivered ? (
                      <>
                        <FiCheckCircle className="text-emerald-500 flex-shrink-0" />
                        Delivered
                      </>
                    ) : (
                      <>
                        <FiCalendar className="text-gold-500 flex-shrink-0" />
                        {order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        }) : '3–7 Business Days'}
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. ORDER ITEMS */}
          {/* ========================================================================= */}
          <div className={`border rounded-2xl p-4 sm:p-6 shadow-xs ${cardBg}`}>
            <h2 className={`text-base sm:text-lg font-serif font-bold mb-4 sm:mb-6 border-b pb-3 ${isDark ? 'text-white border-dark-700' : 'text-gray-900 border-gray-200'}`}>
              Purchased Artifacts
            </h2>
            <div className="divide-y divide-gray-500/10">
              {order.items?.map((item, idx) => (
                <div key={idx} className="py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl p-1.5 border flex-shrink-0 ${
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
                      <h3 className={`text-xs sm:text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {item.coin?.name || item.coinName || 'Numismatic Specimen'}
                      </h3>
                      <p className={`text-[11px] sm:text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Qty: {item.quantity} {item.coin?.condition && `&middot; ${item.coin.condition}`}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs sm:text-sm font-bold sm:text-right ${isDark ? 'text-gold-400' : 'text-gray-900'}`}>
                    {formatPrice((item.priceAtPurchase || item.price || item.coin?.sellingPrice || 0) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. SHIPPING & PAYMENT DETAILS GRID */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
            <div className={`border rounded-2xl p-4 sm:p-6 shadow-xs ${cardBg}`}>
              <h3 className={`text-sm sm:text-base font-serif font-bold mb-3 border-b pb-2 ${isDark ? 'text-white border-dark-700' : 'text-gray-900 border-gray-200'}`}>
                Shipping Destination
              </h3>
              <div className={`text-xs sm:text-sm space-y-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <p className="font-semibold text-gold-500">{order.shippingAddress?.phone || order.user?.phone}</p>
                <p>{order.shippingAddress?.street}</p>
                <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.zipCode}</p>
                <p>{order.shippingAddress?.country || 'India'}</p>
              </div>
            </div>

            <div className={`border rounded-2xl p-4 sm:p-6 shadow-xs ${cardBg}`}>
              <h3 className={`text-sm sm:text-base font-serif font-bold mb-3 border-b pb-2 ${isDark ? 'text-white border-dark-700' : 'text-gray-900 border-gray-200'}`}>
                Payment Breakdown
              </h3>
              <div className={`text-xs sm:text-sm space-y-2.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal || (order.totalAmount ? Math.round(order.totalAmount / 1.18) : 0))}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (18%)</span>
                  <span>{formatPrice(order.tax !== undefined ? order.tax : Math.round(order.totalAmount - (order.totalAmount / 1.18)))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Fee</span>
                  <span className="text-emerald-500 font-semibold">FREE</span>
                </div>
                <div className={`flex justify-between pt-2.5 border-t font-bold text-sm sm:text-base ${isDark ? 'border-dark-700 text-white' : 'border-gray-200 text-gray-900'}`}>
                  <span>Total Paid</span>
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
