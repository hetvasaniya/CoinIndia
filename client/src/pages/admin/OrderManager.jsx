import { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { useTheme } from '../../context/ThemeContext';
import { 
  formatPrice, 
  formatDate, 
  getStatusColor, 
  getRefundStatusColor, 
  getPaymentStatusColor, 
  getImageUrl 
} from '../../utils/helpers';
import toast from 'react-hot-toast';
import { 
  FiSearch, FiFilter, FiRefreshCw, FiEye, FiPrinter, FiXCircle, 
  FiDollarSign, FiBox, FiTruck, FiCheckCircle, FiClock, FiAlertCircle,
  FiUser, FiMapPin, FiCreditCard, FiPackage, FiArrowRight, FiShield, FiTag, FiLock
} from 'react-icons/fi';
import { STATIC_IMAGES } from '../../data/staticImages';

const OrderManager = () => {
  const { isDark } = useTheme();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'packing'

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [packingModalOpen, setPackingModalOpen] = useState(false);

  // Form states for modals
  const [cancelForm, setCancelForm] = useState({
    reason: 'Customer requested cancellation',
    customReason: '',
    refundMethod: 'Original Payment Method',
    notes: '',
  });

  const [refundForm, setRefundForm] = useState({
    refundStatus: 'refunded',
    refundMethod: 'UPI',
    refundAmount: 0,
    refundTransactionId: '',
    refundNotes: '',
  });

  const [trackingForm, setTrackingForm] = useState({
    trackingNumber: '',
    carrier: 'BlueDart / IndiaPost',
    estimatedDelivery: '',
  });

  useEffect(() => {
    fetchOrdersAndStats();
  }, [statusFilter, paymentFilter]);

  const fetchOrdersAndStats = async (isInitial = true) => {
    if (isInitial) setLoading(true);
    try {
      const [ordersData, statsData] = await Promise.all([
        adminService.getOrders({
          status: statusFilter !== 'all' ? statusFilter : undefined,
          paymentStatus: paymentFilter !== 'all' ? paymentFilter : undefined,
        }),
        adminService.getOrderStats().catch(() => null),
      ]);

      const list = ordersData?.orders || (Array.isArray(ordersData) ? ordersData : []);
      setOrders(list);
      if (statsData) {
        setStats(statsData);
      }
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  const refreshStatsSilent = async () => {
    try {
      const statsData = await adminService.getOrderStats();
      if (statsData) setStats(statsData);
    } catch (err) {
      // ignore
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    const targetOrder = orders.find(o => o._id === id) || selectedOrder;
    if (targetOrder?.status?.toLowerCase() === 'delivered') {
      toast.error('Delivered orders are locked and cannot be updated.');
      return;
    }
    try {
      const updated = await adminService.updateOrderStatus(id, { status: newStatus });
      const updatedOrder = updated.order || updated;
      toast.success(`Order status updated to ${newStatus.toUpperCase()}`);
      
      setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, ...updatedOrder } : o)));
      if (selectedOrder && selectedOrder._id === id) {
        setSelectedOrder((prev) => ({ ...prev, ...updatedOrder }));
      }
      refreshStatsSilent();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update order status');
    }
  };

  const openOrderDetail = async (order) => {
    try {
      // Fetch fresh populated order details
      const freshOrder = await adminService.getOrder(order._id);
      setSelectedOrder(freshOrder);
      setTrackingForm({
        trackingNumber: freshOrder.trackingNumber || '',
        carrier: freshOrder.carrier || 'BlueDart / IndiaPost',
        estimatedDelivery: freshOrder.estimatedDelivery ? freshOrder.estimatedDelivery.slice(0, 10) : '',
      });
      setDetailModalOpen(true);
    } catch (err) {
      setSelectedOrder(order);
      setDetailModalOpen(true);
    }
  };

  const openCancelModal = (order, e) => {
    if (e) e.stopPropagation();
    if (order?.status?.toLowerCase() === 'delivered') {
      toast.error('Delivered orders cannot be cancelled.');
      return;
    }
    setSelectedOrder(order);
    setCancelForm({
      reason: 'Customer requested cancellation',
      customReason: '',
      refundMethod: order.paymentMethod || 'Original Payment Method',
      notes: '',
    });
    setCancelModalOpen(true);
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    if (selectedOrder?.status?.toLowerCase() === 'delivered') {
      toast.error('Delivered orders cannot be cancelled.');
      return;
    }
    try {
      const fullReason = cancelForm.customReason 
        ? `${cancelForm.reason} - ${cancelForm.customReason}` 
        : cancelForm.reason;

      const res = await adminService.cancelOrder(selectedOrder._id, {
        reason: fullReason,
        refundMethod: cancelForm.refundMethod,
        refundAmount: selectedOrder.totalAmount,
        notes: cancelForm.notes,
      });

      const updatedOrder = res.order || res;
      toast.success('Order cancelled. Inventory restored to stock.');
      setCancelModalOpen(false);
      setOrders((prev) => prev.map((o) => (o._id === selectedOrder._id ? { ...o, ...updatedOrder } : o)));
      if (selectedOrder) {
        setSelectedOrder((prev) => ({ ...prev, ...updatedOrder }));
      }
      refreshStatsSilent();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  const openRefundModal = (order, e) => {
    if (e) e.stopPropagation();
    setSelectedOrder(order);
    setRefundForm({
      refundStatus: order.refund?.status === 'refunded' ? 'refunded' : 'refunded',
      refundMethod: order.refund?.method || order.paymentMethod || 'UPI',
      refundAmount: order.refund?.amount || order.totalAmount || 0,
      refundTransactionId: order.refund?.transactionId || `REF-${Date.now().toString().slice(-6)}`,
      refundNotes: order.refund?.notes || 'Refund processed via admin dashboard',
    });
    setRefundModalOpen(true);
  };

  const handleRefundSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      const res = await adminService.processRefund(selectedOrder._id, refundForm);
      const updatedOrder = res.order || res;
      toast.success('Refund updated successfully');
      setRefundModalOpen(false);
      setOrders((prev) => prev.map((o) => (o._id === selectedOrder._id ? { ...o, ...updatedOrder } : o)));
      if (selectedOrder) {
        setSelectedOrder((prev) => ({ ...prev, ...updatedOrder }));
      }
      refreshStatsSilent();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update refund');
    }
  };

  const handleSaveTracking = async () => {
    if (!selectedOrder) return;
    if (selectedOrder?.status?.toLowerCase() === 'delivered') {
      toast.error('Delivered orders are locked and tracking details cannot be modified.');
      return;
    }
    try {
      const res = await adminService.updateOrderStatus(selectedOrder._id, {
        trackingNumber: trackingForm.trackingNumber,
        carrier: trackingForm.carrier,
        estimatedDelivery: trackingForm.estimatedDelivery || undefined,
      });
      const updatedOrder = res.order || res;
      toast.success('Tracking information saved');
      setOrders((prev) => prev.map((o) => (o._id === selectedOrder._id ? { ...o, ...updatedOrder } : o)));
      setSelectedOrder((prev) => ({ ...prev, ...updatedOrder }));
    } catch (error) {
      toast.error('Failed to update tracking');
    }
  };

  const openPackingModal = (order, e) => {
    if (e) e.stopPropagation();
    setSelectedOrder(order);
    setPackingModalOpen(true);
  };

  const filteredOrders = orders.filter((order) => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    const orderIdMatch = (order._id && order._id.toLowerCase().includes(term)) ||
      (order.orderNumber && order.orderNumber.toLowerCase().includes(term));
    const userMatch = (order.user?.name && order.user.name.toLowerCase().includes(term)) ||
      (order.user?.email && order.user.email.toLowerCase().includes(term));
    const phoneMatch = order.shippingAddress?.phone && order.shippingAddress.phone.includes(term);
    const cityMatch = order.shippingAddress?.city && order.shippingAddress.city.toLowerCase().includes(term);
    return orderIdMatch || userMatch || phoneMatch || cityMatch;
  });

  const nextStepMap = {
    pending: { label: 'Confirm Order', next: 'confirmed', color: 'bg-blue-600 hover:bg-blue-700' },
    confirmed: { label: 'Start Processing', next: 'processing', color: 'bg-indigo-600 hover:bg-indigo-700' },
    processing: { label: 'Mark Shipped', next: 'shipped', color: 'bg-purple-600 hover:bg-purple-700' },
    shipped: { label: 'Mark Delivered', next: 'delivered', color: 'bg-green-600 hover:bg-green-700' },
  };

  const cardBg = isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200';
  const headerBg = isDark ? 'bg-dark-700/60' : 'bg-[#FAFAF7]';
  const rowHover = isDark ? 'hover:bg-dark-700/50' : 'hover:bg-gray-50';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-serif font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Order Management & Fulfillment</h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Track orders, manage workflow lifecycle, process refunds, and pack shipments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`p-1 rounded-lg flex text-sm border ${isDark ? 'bg-dark-800 border-dark-700' : 'bg-gray-100 border-gray-200'}`}>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'orders' 
                  ? isDark ? 'bg-dark-700 text-white shadow-sm' : 'bg-white text-gray-900 shadow-sm'
                  : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Orders
            </button>
            <button
              onClick={() => setActiveTab('packing')}
              className={`px-4 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'packing' 
                  ? isDark ? 'bg-dark-700 text-gold-400 shadow-sm' : 'bg-white text-gold-600 shadow-sm'
                  : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FiPackage className="w-4 h-4" />
              Packing View
            </button>
          </div>
          <button
            onClick={fetchOrdersAndStats}
            className={`p-2 border rounded-md transition-colors ${
              isDark ? 'border-dark-700 bg-dark-800 hover:bg-dark-700 text-gray-300' : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-600'
            }`}
            title="Refresh Orders"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Revenue & Order Metrics Bar */}
      {stats && (
        <div className="grid grid-cols-2 min-[480px]:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-3">
          {/* Gross Revenue */}
          <div className={`p-3 sm:p-3.5 border rounded-xl shadow-sm transition-colors ${cardBg}`}>
            <p className={`text-[11px] sm:text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Gross Revenue</p>
            <p className={`text-base sm:text-lg font-serif font-bold mt-0.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatPrice(stats.grossRevenue || 0)}</p>
            <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Total Billed</span>
          </div>

          {/* Cancelled Amount */}
          <div className={`p-3 sm:p-3.5 border rounded-xl shadow-sm transition-colors ${
            isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50/80 border-red-200 text-red-700'
          }`}>
            <p className="text-[11px] sm:text-xs font-semibold">Cancelled Amount</p>
            <p className="text-base sm:text-lg font-serif font-bold mt-0.5">-{formatPrice(stats.cancelledOrderAmount || 0)}</p>
            <span className="text-[10px] opacity-80 font-medium">Deducted</span>
          </div>

          {/* Refunded Amount */}
          <div className={`p-3 sm:p-3.5 border rounded-xl shadow-sm transition-colors ${
            isDark ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-purple-50/80 border-purple-200 text-purple-800'
          }`}>
            <p className="text-[11px] sm:text-xs font-semibold">Refunded Amount</p>
            <p className="text-base sm:text-lg font-serif font-bold mt-0.5">{formatPrice(stats.refundedAmount || 0)}</p>
            <span className="text-[10px] opacity-80 font-medium">Processed</span>
          </div>

          {/* Net Revenue */}
          <div className={`p-3 sm:p-3.5 border rounded-xl shadow-sm transition-colors ${
            isDark ? 'bg-gold-500/15 border-gold-500/40' : 'bg-amber-50 border-amber-300'
          }`}>
            <p className="text-[11px] sm:text-xs text-gold-500 font-bold uppercase tracking-wider">Net Revenue</p>
            <p className={`text-base sm:text-lg font-serif font-bold mt-0.5 ${isDark ? 'text-gold-300' : 'text-gray-900'}`}>{formatPrice(stats.netRevenue || 0)}</p>
            <span className="text-[10px] text-emerald-500 font-semibold">Active Net</span>
          </div>

          {/* Total Orders */}
          <div className={`p-3 sm:p-3.5 border rounded-xl shadow-sm transition-colors ${cardBg}`}>
            <p className={`text-[11px] sm:text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Orders</p>
            <p className={`text-base sm:text-lg font-serif font-bold mt-0.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.totalOrders || 0}</p>
            <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Lifetime</span>
          </div>

          {/* Pending / Queue */}
          <div className={`p-3 sm:p-3.5 border rounded-xl shadow-sm transition-colors ${
            isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-amber-50/60 border-amber-200 text-amber-800'
          }`}>
            <p className="text-[11px] sm:text-xs font-semibold">Pending / Queue</p>
            <p className="text-base sm:text-lg font-serif font-bold mt-0.5">{stats.pendingOrders || 0}</p>
            <span className="text-[10px] opacity-80 font-medium">Needs Action</span>
          </div>

          {/* Delivered */}
          <div className={`p-3 sm:p-3.5 border rounded-xl shadow-sm transition-colors ${
            isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
          }`}>
            <p className="text-[11px] sm:text-xs font-semibold">Delivered</p>
            <p className="text-base sm:text-lg font-serif font-bold mt-0.5">{stats.completedOrders || 0}</p>
            <span className="text-[10px] opacity-80 font-medium">Fulfilled</span>
          </div>

          {/* Cancelled */}
          <div className={`p-3 sm:p-3.5 border rounded-xl shadow-sm transition-colors ${
            isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50/60 border-red-200 text-red-700'
          }`}>
            <p className="text-[11px] sm:text-xs font-semibold">Cancelled</p>
            <p className="text-base sm:text-lg font-serif font-bold mt-0.5">{stats.cancelledOrders || 0}</p>
            <span className="text-[10px] opacity-80 font-medium">Restocked</span>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className={`p-3.5 sm:p-4 border rounded-xl shadow-sm space-y-3 sm:space-y-4 transition-colors ${cardBg}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          {/* Status filter tabs */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { key: 'all', label: 'All' },
              { key: 'pending', label: 'Pending' },
              { key: 'confirmed', label: 'Confirmed' },
              { key: 'processing', label: 'Processing' },
              { key: 'shipped', label: 'Shipped' },
              { key: 'delivered', label: 'Delivered' },
              { key: 'cancelled', label: 'Cancelled' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium transition-all ${
                  statusFilter === tab.key
                    ? 'bg-gold-500 text-dark-950 font-bold shadow-sm'
                    : isDark 
                      ? 'bg-dark-700 text-gray-300 hover:bg-dark-600' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search and Payment Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search ID, customer, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full pl-9 pr-3 py-1.5 border rounded-lg text-xs focus:ring-1 focus:ring-gold-500 focus:border-gold-500 transition-colors ${
                  isDark ? 'bg-dark-700 border-dark-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className={`w-full sm:w-auto px-2.5 py-1.5 border rounded-lg text-xs focus:ring-1 focus:ring-gold-500 transition-colors ${
                isDark ? 'bg-dark-700 border-dark-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content: Orders Table vs Packing View */}
      {activeTab === 'orders' ? (
        <div className={`border rounded-xl shadow-sm overflow-hidden transition-colors ${cardBg}`}>
          <div className="overflow-x-auto touch-scroll">
            <table className={`min-w-full divide-y ${isDark ? 'divide-dark-700' : 'divide-gray-200'}`}>
              <thead className={headerBg}>
                <tr>
                  <th className={`px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Order ID</th>
                  <th className={`px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Date</th>
                  <th className={`px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Customer</th>
                  <th className={`px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Items</th>
                  <th className={`px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Total</th>
                  <th className={`px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Payment</th>
                  <th className={`px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Status</th>
                  <th className={`px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-dark-700' : 'divide-gray-200'}`}>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="8" className={`px-6 py-12 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {loading ? 'Loading orders...' : 'No matching orders found.'}
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const isCancelled = order.status?.toLowerCase() === 'cancelled';
                    const isDelivered = order.status?.toLowerCase() === 'delivered';
                    const hasRefund = order.refund && order.refund.status && order.refund.status !== 'none';
                    const displayId = order.orderNumber || `#${order._id.substring(order._id.length - 8).toUpperCase()}`;

                    return (
                      <tr
                        key={order._id}
                        className={`transition-colors cursor-pointer ${
                          isCancelled
                            ? isDark ? 'bg-red-950/20 hover:bg-red-950/30' : 'bg-red-50/30 hover:bg-red-50/50'
                            : isDelivered
                            ? isDark ? 'bg-green-950/20 hover:bg-green-950/30' : 'bg-green-50/20 hover:bg-green-50/40'
                            : isDark ? 'hover:bg-dark-750' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => openOrderDetail(order)}
                      >
                        {/* Order ID */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold ${isCancelled ? 'text-red-500 line-through' : isDark ? 'text-white' : 'text-gray-900'}`}>
                              {displayId}
                            </span>
                            {isCancelled && (
                              <span className="text-[10px] bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 font-bold px-1.5 py-0.5 rounded uppercase">
                                Cancelled
                              </span>
                            )}
                            {isDelivered && (
                              <span className="text-[10px] bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 font-bold px-1.5 py-0.5 rounded uppercase inline-flex items-center gap-0.5">
                                <FiLock className="w-2.5 h-2.5" /> Delivered
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">#{order._id.slice(-6)}</span>
                        </td>

                        {/* Date */}
                        <td className={`px-5 py-4 whitespace-nowrap text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {formatDate(order.createdAt)}
                        </td>

                        {/* Customer */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{order.user?.name || 'Guest'}</div>
                          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{order.user?.email || order.shippingAddress?.phone || ''}</div>
                        </td>

                        {/* Items Thumbnail Preview */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {order.items?.slice(0, 3).map((item, idx) => (
                              <div key={idx} className={`w-8 h-8 rounded border p-0.5 flex-shrink-0 ${isDark ? 'bg-dark-700 border-dark-600' : 'bg-gray-50 border-gray-200'}`} title={item.coinName}>
                                <img
                                  src={item.coinImage || getImageUrl(item.coin?.images)}
                                  alt={item.coinName}
                                  className={`w-full h-full object-contain ${isDark ? '' : 'mix-blend-multiply'}`}
                                />
                              </div>
                            ))}
                            {order.items?.length > 3 && (
                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${isDark ? 'text-gray-300 bg-dark-700' : 'text-gray-500 bg-gray-100'}`}>
                                +{order.items.length - 3}
                              </span>
                            )}
                            <span className={`text-xs ml-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              ({order.items?.reduce((acc, i) => acc + (i.quantity || 1), 0)} pcs)
                            </span>
                          </div>
                        </td>

                        {/* Total */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className={`text-sm ${isCancelled ? (isDark ? 'text-gray-500 line-through' : 'text-gray-400 line-through') : (isDark ? 'text-white font-semibold' : 'text-gray-900 font-semibold')}`}>
                            {formatPrice(order.totalAmount)}
                          </div>
                          {isCancelled && (
                            <span className="text-[10px] text-red-500 dark:text-red-400 block">Excluded from revenue</span>
                          )}
                        </td>

                        {/* Payment */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full capitalize w-fit ${getPaymentStatusColor(order.paymentStatus)}`}>
                              {order.paymentStatus || 'pending'}
                            </span>
                            <span className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {order.paymentMethod || 'Online'}
                            </span>
                            {hasRefund && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium w-fit capitalize ${getRefundStatusColor(order.refund.status)}`}>
                                Refund: {order.refund.status}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status Dropdown */}
                        <td className="px-5 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          {isCancelled ? (
                            <span className="px-3 py-1 text-xs font-bold rounded-full bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-700">
                              CANCELLED
                            </span>
                          ) : isDelivered ? (
                            <span className="px-3 py-1 text-xs font-bold rounded-full bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border border-green-300 dark:border-green-700 inline-flex items-center gap-1">
                              <FiLock className="w-3 h-3" /> DELIVERED (LOCKED)
                            </span>
                          ) : (
                            <select
                              value={order.status?.toLowerCase() || 'pending'}
                              onChange={(e) => handleStatusChange(order._id, e.target.value)}
                              className={`text-xs rounded-full px-3 py-1 border font-medium focus:ring-0 cursor-pointer capitalize ${getStatusColor(order.status)}`}
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancel Order...</option>
                            </select>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 whitespace-nowrap text-right text-xs font-medium space-x-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => openOrderDetail(order)}
                            className={`p-1.5 rounded transition-colors ${isDark ? 'text-gray-300 hover:text-white hover:bg-dark-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                            title="View Details"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={(e) => openPackingModal(order, e)}
                            className={`p-1.5 rounded transition-colors ${isDark ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/40' : 'text-amber-700 hover:text-amber-900 hover:bg-amber-50'}`}
                            title="Packing Slip"
                          >
                            <FiPackage className="w-4 h-4" />
                          </button>

                          {!isCancelled && !isDelivered && (
                            <button
                              onClick={(e) => openCancelModal(order, e)}
                              className={`p-1.5 rounded transition-colors ${isDark ? 'text-red-400 hover:text-red-300 hover:bg-red-950/40' : 'text-red-600 hover:text-red-800 hover:bg-red-50'}`}
                              title="Cancel Order"
                            >
                              <FiXCircle className="w-4 h-4" />
                            </button>
                          )}

                          {isCancelled && order.paymentStatus === 'paid' && (
                            <button
                              onClick={(e) => openRefundModal(order, e)}
                              className={`p-1.5 rounded transition-colors ${isDark ? 'text-purple-400 hover:text-purple-300 hover:bg-purple-950/40' : 'text-purple-600 hover:text-purple-800 hover:bg-purple-50'}`}
                              title="Process Refund"
                            >
                              <FiDollarSign className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Dedicated Packing Queue View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.filter(o => o.status !== 'cancelled' && o.status !== 'delivered').length === 0 ? (
            <div className={`col-span-full p-12 text-center border rounded-xl ${cardBg}`}>
              <FiCheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Packing Queue Clean!</h3>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>There are no pending orders requiring packing at this moment.</p>
            </div>
          ) : (
            filteredOrders
              .filter(o => o.status !== 'cancelled' && o.status !== 'delivered')
              .map((order) => {
                const nextStep = nextStepMap[order.status?.toLowerCase()] || nextStepMap.confirmed;
                return (
                  <div key={order._id} className={`border rounded-xl p-5 shadow-sm flex flex-col justify-between transition-colors ${cardBg}`}>
                    <div>
                      <div className={`flex items-center justify-between pb-3 border-b mb-3 ${isDark ? 'border-dark-700' : 'border-gray-100'}`}>
                        <div>
                          <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{order.orderNumber || `#${order._id.slice(-8)}`}</span>
                          <span className={`text-xs block ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>{formatDate(order.createdAt)}</span>
                        </div>
                        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full capitalize ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>

                      {/* Items to Pack */}
                      <div className="space-y-2 mb-4">
                        <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Items to Pack:</p>
                        {order.items?.map((item, idx) => (
                          <div key={idx} className={`flex items-center justify-between p-2 rounded border ${isDark ? 'bg-dark-700 border-dark-600' : 'bg-[#FAFAF7] border-gray-100'}`}>
                            <div className="flex items-center gap-2.5">
                              <img
                                src={item.coinImage || getImageUrl(item.coin?.images)}
                                alt={item.coinName}
                                className={`w-8 h-8 object-contain ${isDark ? '' : 'mix-blend-multiply'}`}
                              />
                              <div>
                                <p className={`text-xs font-medium line-clamp-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.coinName}</p>
                                <p className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {item.coin?.denomination || item.coin?.material || 'Numismatic item'}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-300 px-2 py-0.5 rounded">
                              × {item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Customer & Shipping info */}
                      <div className={`text-xs p-2.5 rounded border space-y-1 mb-4 ${isDark ? 'bg-dark-750 border-dark-600 text-gray-300' : 'bg-gray-50 border-gray-100 text-gray-600'}`}>
                        <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{order.user?.name || 'Customer'}</p>
                        <p>{order.shippingAddress?.street}, {order.shippingAddress?.city}</p>
                        <p>{order.shippingAddress?.state} - {order.shippingAddress?.zipCode}</p>
                        <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Phone: {order.shippingAddress?.phone || order.user?.phone || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Fast Actions */}
                    <div className={`pt-3 border-t flex items-center justify-between gap-2 ${isDark ? 'border-dark-700' : 'border-gray-100'}`}>
                      <button
                        onClick={() => openPackingModal(order)}
                        className={`px-3 py-1.5 border text-xs rounded flex items-center gap-1 transition-colors ${
                          isDark ? 'border-dark-600 text-gray-300 hover:bg-dark-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <FiPrinter className="w-3.5 h-3.5" />
                        Slip
                      </button>
                      <button
                        onClick={() => handleStatusChange(order._id, nextStep.next)}
                        className={`flex-1 py-1.5 px-3 text-white text-xs font-medium rounded shadow-sm flex items-center justify-center gap-1.5 transition-colors ${nextStep.color}`}
                      >
                        {nextStep.label}
                        <FiArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. COMPREHENSIVE ORDER DETAILS MODAL / DRAWER */}
      {/* ========================================================================= */}
      {detailModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4">
          <div className={`rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto touch-scroll border transition-colors ${isDark ? 'bg-dark-800 border-dark-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
            {/* Modal Header */}
            <div className={`sticky top-0 border-b px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between z-10 ${isDark ? 'bg-dark-750 border-dark-700' : 'bg-[#FAFAF7] border-gray-200'}`}>
              <div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <h2 className={`text-lg sm:text-xl font-serif ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Order {selectedOrder.orderNumber || `#${selectedOrder._id.slice(-8).toUpperCase()}`}
                  </h2>
                  <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full uppercase ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                  <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full uppercase ${getPaymentStatusColor(selectedOrder.paymentStatus)}`}>
                    {selectedOrder.paymentStatus}
                  </span>
                </div>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Placed on {formatDate(selectedOrder.createdAt)} &middot; Database ID: {selectedOrder._id}
                </p>
              </div>
              <button
                onClick={() => setDetailModalOpen(false)}
                className={`p-1.5 rounded-full transition-colors ${isDark ? 'text-gray-400 hover:text-white hover:bg-dark-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'}`}
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* STATUS WORKFLOW STEPPER */}
              <div className={`p-5 border rounded-xl ${isDark ? 'bg-dark-750 border-dark-700' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Fulfillment Status Workflow
                </h3>

                {selectedOrder.status === 'delivered' ? (
                  <div className={`border rounded-lg p-4 flex items-start gap-3 ${isDark ? 'bg-green-950/30 border-green-800/50' : 'bg-green-50 border-green-200'}`}>
                    <FiCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className={`text-sm font-bold flex items-center gap-1.5 ${isDark ? 'text-green-300' : 'text-green-900'}`}>
                        <FiLock className="w-4 h-4 text-green-500" /> ORDER IS DELIVERED & COMPLETED (LOCKED)
                      </h4>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-green-400/90' : 'text-green-700'}`}>
                        This order has been successfully delivered and fulfilled. To preserve audit records and prevent accidental changes, all status, tracking, and details are read-only.
                      </p>
                    </div>
                  </div>
                ) : selectedOrder.status === 'cancelled' ? (
                  <div className={`border rounded-lg p-4 flex items-start gap-3 ${isDark ? 'bg-red-950/30 border-red-800/50' : 'bg-red-50 border-red-200'}`}>
                    <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className={`text-sm font-bold ${isDark ? 'text-red-300' : 'text-red-900'}`}>ORDER IS PERMANENTLY CANCELLED</h4>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-red-400/90' : 'text-red-700'}`}>
                        This order cannot be confirmed, processed, shipped, or delivered. All purchased item quantities were restored to inventory.
                      </p>
                      {selectedOrder.cancelledAt && (
                        <p className={`text-xs mt-2 font-medium ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                          Cancelled on {formatDate(selectedOrder.cancelledAt)} &middot; Reason: {selectedOrder.cancellationReason || 'No reason provided'}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between relative">
                      <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 ${isDark ? 'bg-dark-600' : 'bg-gray-200'}`}></div>
                      {['pending', 'confirmed', 'processing', 'shipped', 'delivered'].map((step, idx, arr) => {
                        const stepsOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
                        const currentIndex = stepsOrder.indexOf(selectedOrder.status?.toLowerCase());
                        const isDone = idx <= currentIndex;
                        const isCurrent = idx === currentIndex;

                        return (
                          <div key={step} className="flex flex-col items-center relative z-10">
                            <button
                              disabled={selectedOrder.status === 'delivered'}
                              onClick={() => handleStatusChange(selectedOrder._id, step)}
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                isDone
                                  ? 'bg-[#B8860B] text-white ring-2 ring-amber-200 dark:ring-amber-900/50'
                                  : isDark
                                  ? 'bg-dark-700 border-2 border-dark-600 text-gray-400 hover:border-gray-500'
                                  : 'bg-white border-2 border-gray-300 text-gray-400 hover:border-gray-400'
                              } ${isCurrent ? 'scale-110 shadow-md ring-4 ring-amber-100 dark:ring-amber-900/30' : ''} ${selectedOrder.status === 'delivered' ? 'cursor-not-allowed opacity-90' : ''}`}
                            >
                              {idx + 1}
                            </button>
                            <span className={`text-xs mt-1.5 capitalize font-medium ${isDone ? (isDark ? 'text-white' : 'text-gray-900') : 'text-gray-400'}`}>
                              {step}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className={`mt-4 pt-4 border-t flex flex-wrap items-center justify-between gap-3 ${isDark ? 'border-dark-700' : 'border-gray-100'}`}>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Quick Advance:</span>
                        {selectedOrder.status === 'pending' && (
                          <button
                            onClick={() => handleStatusChange(selectedOrder._id, 'confirmed')}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                          >
                            Confirm Order
                          </button>
                        )}
                        {selectedOrder.status === 'confirmed' && (
                          <button
                            onClick={() => handleStatusChange(selectedOrder._id, 'processing')}
                            className="px-3 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700"
                          >
                            Mark Processing
                          </button>
                        )}
                        {selectedOrder.status === 'processing' && (
                          <button
                            onClick={() => handleStatusChange(selectedOrder._id, 'shipped')}
                            className="px-3 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
                          >
                            Mark Shipped
                          </button>
                        )}
                        {selectedOrder.status === 'shipped' && (
                          <button
                            onClick={() => handleStatusChange(selectedOrder._id, 'delivered')}
                            className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                          >
                            Mark Delivered
                          </button>
                        )}
                      </div>

                      <button
                        onClick={(e) => openCancelModal(selectedOrder, e)}
                        className="px-3 py-1 text-xs text-red-500 hover:bg-red-500/10 border border-red-500/30 rounded font-medium transition-colors"
                      >
                        Cancel This Order
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 2 COLUMNS: Customer + Shipping */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Info Card */}
                <div className={`p-5 border rounded-xl space-y-3 ${isDark ? 'bg-dark-750 border-dark-700' : 'bg-white border-gray-200'}`}>
                  <div className={`flex items-center gap-2 border-b pb-2 ${isDark ? 'border-dark-700 text-gray-300' : 'border-gray-100 text-gray-700'}`}>
                    <FiUser className="w-4 h-4 text-[#B8860B]" />
                    <h4 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>Customer Details</h4>
                  </div>
                  <div className={`text-xs space-y-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    <p><strong className={isDark ? 'text-white' : 'text-gray-900'}>Name:</strong> {selectedOrder.user?.name || 'Guest'}</p>
                    <p><strong className={isDark ? 'text-white' : 'text-gray-900'}>Email:</strong> {selectedOrder.user?.email || 'N/A'}</p>
                    <p><strong className={isDark ? 'text-white' : 'text-gray-900'}>Mobile Phone:</strong> {selectedOrder.shippingAddress?.phone || selectedOrder.user?.phone || 'N/A'}</p>
                    <p><strong className={isDark ? 'text-white' : 'text-gray-900'}>User ID:</strong> {selectedOrder.user?._id || 'N/A'}</p>
                  </div>
                </div>

                {/* Shipping Info Card */}
                <div className={`p-5 border rounded-xl space-y-3 ${isDark ? 'bg-dark-750 border-dark-700' : 'bg-white border-gray-200'}`}>
                  <div className={`flex items-center gap-2 border-b pb-2 ${isDark ? 'border-dark-700 text-gray-300' : 'border-gray-100 text-gray-700'}`}>
                    <FiMapPin className="w-4 h-4 text-[#B8860B]" />
                    <h4 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>Shipping Address</h4>
                  </div>
                  <div className={`text-xs space-y-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedOrder.shippingAddress?.street}</p>
                    {selectedOrder.shippingAddress?.landmark && (
                      <p><span className="text-amber-500 font-medium">Landmark:</span> {selectedOrder.shippingAddress.landmark}</p>
                    )}
                    <p>{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.zipCode}</p>
                    <p>{selectedOrder.shippingAddress?.country || 'India'}</p>
                    <p className={`pt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}><strong>Contact Phone:</strong> {selectedOrder.shippingAddress?.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* PRODUCTS & LIVE INVENTORY TABLE */}
              <div className={`border rounded-xl overflow-hidden ${isDark ? 'bg-dark-750 border-dark-700' : 'bg-white border-gray-200'}`}>
                <div className={`px-5 py-3 border-b flex items-center justify-between ${isDark ? 'bg-dark-700 border-dark-600' : 'bg-[#FAFAF7] border-gray-200'}`}>
                  <h4 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>Ordered Products</h4>
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{selectedOrder.items?.length} items</span>
                </div>
                <div className="overflow-x-auto">
                  <table className={`min-w-full divide-y text-xs ${isDark ? 'divide-dark-700' : 'divide-gray-200'}`}>
                    <thead className={isDark ? 'bg-dark-700 text-gray-300' : 'bg-gray-50 text-gray-500'}>
                      <tr>
                        <th className="px-4 py-2.5 text-left uppercase">Product</th>
                        <th className="px-4 py-2.5 text-left uppercase">Specs / SKU</th>
                        <th className="px-4 py-2.5 text-center uppercase">Qty</th>
                        <th className="px-4 py-2.5 text-left uppercase">Current Live Stock</th>
                        <th className="px-4 py-2.5 text-right uppercase">Unit Price</th>
                        <th className="px-4 py-2.5 text-right uppercase">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-dark-700' : 'divide-gray-100'}`}>
                      {selectedOrder.items?.map((item, idx) => {
                        const currentStock = item.coin?.quantity !== undefined ? item.coin.quantity : null;

                        return (
                          <tr key={idx} className={isDark ? 'hover:bg-dark-700/50' : 'hover:bg-gray-50/80'}>
                            <td className="px-4 py-3 flex items-center gap-3">
                              <img
                                src={item.coinImage || getImageUrl(item.coin?.images)}
                                alt={item.coinName}
                                className={`w-10 h-10 object-contain rounded border p-0.5 ${isDark ? 'bg-dark-700 border-dark-600' : 'bg-white border-gray-200 mix-blend-multiply'}`}
                              />
                              <div>
                                <p className={`font-semibold text-xs ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.coinName}</p>
                                <p className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>ID: {item.coin?._id || item.coin}</p>
                              </div>
                            </td>
                            <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                              <p>{item.coin?.denomination || 'Artifact'}</p>
                              <p className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>{item.coin?.era || item.coin?.material || 'Rare'}</p>
                            </td>
                            <td className={`px-4 py-3 text-center font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3">
                              {currentStock !== null ? (
                                currentStock > 5 ? (
                                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300">
                                    {currentStock} units in stock
                                  </span>
                                ) : currentStock > 0 ? (
                                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300">
                                    Low Stock: {currentStock} left
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300">
                                    Out of stock (0)
                                  </span>
                                )
                              ) : (
                                <span className={isDark ? 'text-gray-400' : 'text-gray-400'}>Available</span>
                              )}
                            </td>
                            <td className={`px-4 py-3 text-right font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              {formatPrice(item.priceAtPurchase || 0)}
                            </td>
                            <td className={`px-4 py-3 text-right font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {formatPrice((item.priceAtPurchase || 0) * item.quantity)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2 COLUMNS: Payment & Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Payment Breakdown Card */}
                <div className={`p-5 border rounded-xl space-y-3 ${isDark ? 'bg-dark-750 border-dark-700' : 'bg-white border-gray-200'}`}>
                  <div className={`flex items-center gap-2 border-b pb-2 ${isDark ? 'border-dark-700 text-gray-300' : 'border-gray-100 text-gray-700'}`}>
                    <FiCreditCard className="w-4 h-4 text-[#B8860B]" />
                    <h4 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>Payment Information</h4>
                  </div>
                  <div className={`text-xs space-y-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    <p><strong className={isDark ? 'text-white' : 'text-gray-900'}>Payment Method:</strong> {selectedOrder.paymentMethod || 'Razorpay Online'}</p>
                    <p><strong className={isDark ? 'text-white' : 'text-gray-900'}>Payment Status:</strong> <span className={`px-2 py-0.5 rounded-full font-semibold capitalize ${getPaymentStatusColor(selectedOrder.paymentStatus)}`}>{selectedOrder.paymentStatus}</span></p>
                    <p><strong className={isDark ? 'text-white' : 'text-gray-900'}>Razorpay Payment ID:</strong> <span className={`font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{selectedOrder.razorpayPaymentId || 'N/A'}</span></p>
                    <p><strong className={isDark ? 'text-white' : 'text-gray-900'}>Razorpay Order ID:</strong> <span className={`font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{selectedOrder.razorpayOrderId || 'N/A'}</span></p>
                    <p><strong className={isDark ? 'text-white' : 'text-gray-900'}>Paid Amount:</strong> <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatPrice(selectedOrder.totalAmount)}</span></p>
                  </div>
                </div>

                {/* Financial Totals Card */}
                <div className={`p-5 border rounded-xl space-y-3 ${isDark ? 'bg-dark-750 border-dark-700' : 'bg-white border-gray-200'}`}>
                  <h4 className={`text-sm font-bold uppercase tracking-wider border-b pb-2 ${isDark ? 'border-dark-700 text-white' : 'border-gray-100 text-gray-900'}`}>Financial Breakdown</h4>
                  <div className={`text-xs space-y-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    <div className="flex justify-between">
                      <span>Items Subtotal:</span>
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatPrice(selectedOrder.subtotal || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST Tax (18%):</span>
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatPrice(selectedOrder.tax || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping Fee:</span>
                      <span className="text-green-500 font-medium">{selectedOrder.shippingFee ? formatPrice(selectedOrder.shippingFee) : 'FREE'}</span>
                    </div>
                    <div className={`flex justify-between border-t pt-2 text-sm ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
                      <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Total Billed:</span>
                      <span className={`font-bold font-serif text-base ${isDark ? 'text-gold-400' : 'text-gray-900'}`}>{formatPrice(selectedOrder.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* REFUND AUDIT SECTION */}
              {(selectedOrder.refund?.status && selectedOrder.refund.status !== 'none' || selectedOrder.status === 'cancelled') && (
                <div className={`border rounded-xl p-5 space-y-3 ${isDark ? 'bg-purple-950/20 border-purple-800/40' : 'bg-purple-50/50 border-purple-200'}`}>
                  <div className={`flex items-center justify-between border-b pb-2 ${isDark ? 'border-purple-800/40' : 'border-purple-200'}`}>
                    <div className="flex items-center gap-2">
                      <FiDollarSign className="w-5 h-5 text-purple-400" />
                      <h4 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-purple-300' : 'text-purple-900'}`}>Refund Management</h4>
                    </div>
                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full capitalize ${getRefundStatusColor(selectedOrder.refund?.status)}`}>
                      {selectedOrder.refund?.status ? `Status: ${selectedOrder.refund.status}` : 'Pending Refund'}
                    </span>
                  </div>

                  <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <div>
                      <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Refund Amount:</p>
                      <p className={`font-bold text-sm ${isDark ? 'text-purple-300' : 'text-purple-900'}`}>{formatPrice(selectedOrder.refund?.amount || selectedOrder.totalAmount)}</p>
                    </div>
                    <div>
                      <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Refund Method:</p>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedOrder.refund?.method || selectedOrder.paymentMethod || 'Original Method'}</p>
                    </div>
                    <div>
                      <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Reference / Txn ID:</p>
                      <p className={`font-mono ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>{selectedOrder.refund?.transactionId || 'Pending Assignment'}</p>
                    </div>
                  </div>

                  {selectedOrder.refund?.notes && (
                    <p className={`text-xs p-2 rounded border ${isDark ? 'bg-dark-800/60 border-purple-800/30 text-gray-300' : 'bg-white/70 border-purple-100 text-gray-600'}`}>
                      <strong>Admin Notes:</strong> {selectedOrder.refund.notes}
                    </p>
                  )}

                  <div className="pt-2 flex items-center justify-end">
                    <button
                      onClick={(e) => openRefundModal(selectedOrder, e)}
                      className="px-4 py-1.5 bg-purple-700 text-white rounded text-xs font-semibold hover:bg-purple-800 shadow-sm"
                    >
                      Update / Process Refund
                    </button>
                  </div>
                </div>
              )}

              {/* TRACKING AND SHIPPING DETAILS */}
              <div className={`p-5 border rounded-xl space-y-3 ${isDark ? 'bg-dark-750 border-dark-700' : 'bg-white border-gray-200'}`}>
                <div className={`flex items-center gap-2 border-b pb-2 ${isDark ? 'border-dark-700 text-gray-300' : 'border-gray-100 text-gray-700'}`}>
                  <FiTruck className="w-4 h-4 text-[#B8860B]" />
                  <h4 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>Courier & Tracking Details</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={`text-xs font-medium block mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Carrier Name</label>
                    <input
                      type="text"
                      disabled={selectedOrder.status === 'delivered'}
                      value={trackingForm.carrier}
                      onChange={(e) => setTrackingForm({ ...trackingForm, carrier: e.target.value })}
                      placeholder="e.g. BlueDart / Delhivery / IndiaPost"
                      className={`w-full text-xs px-3 py-2 border rounded focus:ring-1 focus:ring-[#B8860B] transition-colors ${
                        isDark ? 'bg-dark-700 border-dark-600 text-white placeholder-gray-500 disabled:bg-dark-800 disabled:text-gray-500 disabled:cursor-not-allowed' : 'bg-white border-gray-300 text-gray-900 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`text-xs font-medium block mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Tracking Number</label>
                    <input
                      type="text"
                      disabled={selectedOrder.status === 'delivered'}
                      value={trackingForm.trackingNumber}
                      onChange={(e) => setTrackingForm({ ...trackingForm, trackingNumber: e.target.value })}
                      placeholder="e.g. BD123456789IN"
                      className={`w-full text-xs px-3 py-2 border rounded focus:ring-1 focus:ring-[#B8860B] transition-colors ${
                        isDark ? 'bg-dark-700 border-dark-600 text-white placeholder-gray-500 disabled:bg-dark-800 disabled:text-gray-500 disabled:cursor-not-allowed' : 'bg-white border-gray-300 text-gray-900 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`text-xs font-medium block mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Estimated Delivery Date</label>
                    <input
                      type="date"
                      disabled={selectedOrder.status === 'delivered'}
                      value={trackingForm.estimatedDelivery}
                      onChange={(e) => setTrackingForm({ ...trackingForm, estimatedDelivery: e.target.value })}
                      className={`w-full text-xs px-3 py-2 border rounded focus:ring-1 focus:ring-[#B8860B] transition-colors ${
                        isDark ? 'bg-dark-700 border-dark-600 text-white disabled:bg-dark-800 disabled:text-gray-500 disabled:cursor-not-allowed' : 'bg-white border-gray-300 text-gray-900 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed'
                      }`}
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  {selectedOrder.status === 'delivered' ? (
                    <span className={`text-xs font-medium flex items-center gap-1.5 px-3 py-1.5 rounded border ${isDark ? 'bg-dark-700 border-dark-600 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>
                      <FiLock className="w-3.5 h-3.5 text-gray-400" /> Tracking Details Locked (Delivered)
                    </span>
                  ) : (
                    <button
                      onClick={handleSaveTracking}
                      className="px-3 py-1.5 bg-[#B8860B] hover:bg-[#996515] text-white text-xs rounded transition-colors"
                    >
                      Save Tracking Details
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`border-t px-6 py-4 flex items-center justify-between ${isDark ? 'bg-dark-750 border-dark-700' : 'bg-[#FAFAF7] border-gray-200'}`}>
              <button
                onClick={() => openPackingModal(selectedOrder)}
                className={`px-4 py-2 border rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  isDark ? 'border-dark-600 text-gray-300 hover:bg-dark-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FiPrinter className="w-4 h-4" />
                Print Packing Slip
              </button>
              <button
                onClick={() => setDetailModalOpen(false)}
                className={`px-5 py-2 rounded text-xs font-semibold transition-colors ${
                  isDark ? 'bg-gold-500 hover:bg-gold-600 text-dark-900' : 'bg-[#1a1a1a] hover:bg-gray-800 text-white'
                }`}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CANCEL ORDER CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {cancelModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4">
          <div className={`rounded-xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto touch-scroll border p-4 sm:p-6 space-y-4 transition-colors ${isDark ? 'bg-dark-800 border-red-900/40 text-white' : 'bg-white border-red-200 text-gray-900'}`}>
            <div className={`flex items-center gap-3 border-b pb-3 ${isDark ? 'border-dark-700 text-red-400' : 'border-gray-200 text-red-600'}`}>
              <FiXCircle className="w-6 h-6 flex-shrink-0" />
              <div>
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Cancel Order #{selectedOrder.orderNumber || selectedOrder._id.slice(-8)}</h3>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Order total: {formatPrice(selectedOrder.totalAmount)}</p>
              </div>
            </div>

            {/* Warning rules */}
            <div className={`p-3.5 rounded border text-xs space-y-1.5 ${isDark ? 'bg-red-950/30 border-red-800/40 text-red-300' : 'bg-red-50 border-red-100 text-red-800'}`}>
              <p className="font-bold flex items-center gap-1.5">
                <FiShield className="w-4 h-4" />
                Cancellation Effects:
              </p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Order status will permanently become <strong>CANCELLED</strong> and cannot be shipped or delivered.</li>
                <li>Purchased items will <strong>automatically be restored to live inventory</strong>.</li>
                {selectedOrder.paymentStatus === 'paid' ? (
                  <li>A <strong>refund record of {formatPrice(selectedOrder.totalAmount)}</strong> will be created in Refund Pending status.</li>
                ) : (
                  <li>No payment refund required (order was not collected).</li>
                )}
                <li>Amount will be <strong>deducted from Net Revenue</strong> calculations.</li>
              </ul>
            </div>

            <form onSubmit={handleCancelSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className={`font-semibold block mb-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Reason for Cancellation</label>
                <select
                  value={cancelForm.reason}
                  onChange={(e) => setCancelForm({ ...cancelForm, reason: e.target.value })}
                  className={`w-full px-3 py-2 border rounded focus:ring-1 focus:ring-red-500 transition-colors ${
                    isDark ? 'bg-dark-700 border-dark-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="Customer requested cancellation">Customer requested cancellation</option>
                  <option value="Out of stock / Damaged artifact">Out of stock / Damaged artifact</option>
                  <option value="Address unreachable / Undeliverable">Address unreachable / Undeliverable</option>
                  <option value="Suspected fraudulent transaction">Suspected fraudulent transaction</option>
                  <option value="Payment / Gateway verification issue">Payment / Gateway verification issue</option>
                  <option value="Other">Other reason</option>
                </select>
              </div>

              <div>
                <label className={`font-semibold block mb-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Additional Notes / Details</label>
                <input
                  type="text"
                  placeholder="Provide specific notes or customer remarks..."
                  value={cancelForm.customReason}
                  onChange={(e) => setCancelForm({ ...cancelForm, customReason: e.target.value })}
                  className={`w-full px-3 py-2 border rounded focus:ring-1 focus:ring-red-500 transition-colors ${
                    isDark ? 'bg-dark-700 border-dark-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>

              {selectedOrder.paymentStatus === 'paid' && (
                <div>
                  <label className={`font-semibold block mb-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Refund Method</label>
                  <select
                    value={cancelForm.refundMethod}
                    onChange={(e) => setCancelForm({ ...cancelForm, refundMethod: e.target.value })}
                    className={`w-full px-3 py-2 border rounded focus:ring-1 focus:ring-red-500 transition-colors ${
                      isDark ? 'bg-dark-700 border-dark-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="Original Payment Method">Original Payment Method (Razorpay / UPI)</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="Wallet">Wallet</option>
                    <option value="Cash on Delivery">Cash on Delivery</option>
                  </select>
                </div>
              )}

              <div className={`pt-3 border-t flex items-center justify-end gap-3 ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  className={`px-4 py-2 border rounded font-medium transition-colors ${
                    isDark ? 'border-dark-600 text-gray-300 hover:bg-dark-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Go Back
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700 shadow-sm"
                >
                  Confirm & Cancel Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. REFUND MANAGEMENT MODAL */}
      {/* ========================================================================= */}
      {refundModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4">
          <div className={`rounded-xl shadow-2xl max-w-md w-full max-h-[92vh] overflow-y-auto touch-scroll border p-4 sm:p-6 space-y-4 transition-colors ${isDark ? 'bg-dark-800 border-purple-900/40 text-white' : 'bg-white border-purple-200 text-gray-900'}`}>
            <div className={`flex items-center gap-3 border-b pb-3 ${isDark ? 'border-dark-700 text-purple-400' : 'border-gray-200 text-purple-700'}`}>
              <FiDollarSign className="w-6 h-6 flex-shrink-0" />
              <div>
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Process / Update Refund</h3>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Order #{selectedOrder.orderNumber || selectedOrder._id.slice(-8)}</p>
              </div>
            </div>

            <form onSubmit={handleRefundSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className={`font-semibold block mb-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Refund Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={refundForm.refundAmount}
                  onChange={(e) => setRefundForm({ ...refundForm, refundAmount: e.target.value })}
                  className={`w-full px-3 py-2 border rounded focus:ring-1 focus:ring-purple-500 font-bold text-sm transition-colors ${
                    isDark ? 'bg-dark-700 border-dark-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className={`font-semibold block mb-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Refund Lifecycle Status</label>
                <select
                  value={refundForm.refundStatus}
                  onChange={(e) => setRefundForm({ ...refundForm, refundStatus: e.target.value })}
                  className={`w-full px-3 py-2 border rounded focus:ring-1 focus:ring-purple-500 transition-colors ${
                    isDark ? 'bg-dark-700 border-dark-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="pending">Refund Pending (Queued)</option>
                  <option value="processing">Refund Processing (Bank initiated)</option>
                  <option value="refunded">Refunded (Completed)</option>
                  <option value="failed">Refund Failed</option>
                </select>
              </div>

              <div>
                <label className={`font-semibold block mb-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Refund Method</label>
                <select
                  value={refundForm.refundMethod}
                  onChange={(e) => setRefundForm({ ...refundForm, refundMethod: e.target.value })}
                  className={`w-full px-3 py-2 border rounded focus:ring-1 focus:ring-purple-500 transition-colors ${
                    isDark ? 'bg-dark-700 border-dark-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="UPI">UPI Transfer</option>
                  <option value="Card">Card Reversal</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="Wallet">Wallet Balance</option>
                  <option value="Original Payment Method">Original Payment Gateway (Razorpay)</option>
                  <option value="Cash on Delivery">Cash on Delivery (No Payout)</option>
                </select>
              </div>

              <div>
                <label className={`font-semibold block mb-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Refund Transaction / UTR / Reference ID</label>
                <input
                  type="text"
                  placeholder="e.g. UTR1293847291 or rzp_ref_123"
                  value={refundForm.refundTransactionId}
                  onChange={(e) => setRefundForm({ ...refundForm, refundTransactionId: e.target.value })}
                  className={`w-full px-3 py-2 border rounded focus:ring-1 focus:ring-purple-500 font-mono transition-colors ${
                    isDark ? 'bg-dark-700 border-dark-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>

              <div>
                <label className={`font-semibold block mb-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Admin Notes</label>
                <textarea
                  rows="2"
                  placeholder="Notes on transaction or customer communication..."
                  value={refundForm.refundNotes}
                  onChange={(e) => setRefundForm({ ...refundForm, refundNotes: e.target.value })}
                  className={`w-full px-3 py-2 border rounded focus:ring-1 focus:ring-purple-500 transition-colors ${
                    isDark ? 'bg-dark-700 border-dark-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>

              <div className={`pt-3 border-t flex items-center justify-end gap-3 ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
                <button
                  type="button"
                  onClick={() => setRefundModalOpen(false)}
                  className={`px-4 py-2 border rounded font-medium transition-colors ${
                    isDark ? 'border-dark-600 text-gray-300 hover:bg-dark-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-700 text-white rounded font-bold hover:bg-purple-800 shadow-sm"
                >
                  Save Refund Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. DEDICATED PACKING VIEW & PRINT SLIP MODAL */}
      {/* ========================================================================= */}
      {packingModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4">
          <div className={`rounded-xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto touch-scroll border overflow-hidden transition-colors ${isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'}`}>
            {/* Action Bar (Not Printed) */}
            <div className={`px-4 sm:px-6 py-3 border-b flex items-center justify-between print:hidden ${isDark ? 'bg-dark-750 border-dark-700' : 'bg-[#FAFAF7] border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <FiPackage className="w-5 h-5 text-[#B8860B]" />
                <h3 className={`font-serif text-sm sm:text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Packing View & Dispatch Slip</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors ${
                    isDark ? 'bg-gold-500 hover:bg-gold-600 text-dark-900' : 'bg-[#1a1a1a] hover:bg-gray-800 text-white'
                  }`}
                >
                  <FiPrinter className="w-4 h-4" />
                  Print Slip
                </button>
                <button
                  onClick={() => setPackingModalOpen(false)}
                  className={`p-1 rounded-full transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Packing Sheet (Pure White Background & Black Text for crystal clear print & display) */}
            <div className="p-4 sm:p-8 space-y-4 sm:space-y-6 !text-gray-900 bg-white" id="packing-slip" style={{ color: '#111827', backgroundColor: '#ffffff' }}>
              {/* Slip Header */}
              <div className="flex justify-between items-start border-b-2 border-gray-900 pb-4">
                <div className="flex items-center gap-3">
                  <img 
                    src={STATIC_IMAGES.logo.main} 
                    alt="Coinomart" 
                    className="h-11 w-auto max-w-[160px] object-contain rounded" 
                  />
                  <div>
                    <h2 className="text-2xl font-serif tracking-wider font-bold !text-black" style={{ color: '#000000' }}>COINOMART</h2>
                    <p className="text-xs !text-gray-700 uppercase tracking-widest mt-0.5 font-semibold" style={{ color: '#374151' }}>Numismatic Fulfillment Slip</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold font-mono !text-black" style={{ color: '#000000' }}>ORDER #{selectedOrder.orderNumber || selectedOrder._id.slice(-8).toUpperCase()}</p>
                  <p className="text-xs !text-gray-600 font-medium" style={{ color: '#4b5563' }}>Date: {formatDate(selectedOrder.createdAt)}</p>
                  <span className={`inline-block mt-1 px-2.5 py-0.5 text-xs font-bold rounded-full uppercase ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="grid grid-cols-2 gap-6 text-xs border border-gray-200 p-4 rounded bg-gray-50/50">
                <div>
                  <p className="font-bold uppercase tracking-wider text-gray-500 text-[10px] mb-1">Ship To Customer:</p>
                  <p className="font-bold text-sm text-gray-900">{selectedOrder.user?.name || 'Customer'}</p>
                  <p className="text-gray-700 mt-1">{selectedOrder.shippingAddress?.street}</p>
                  {selectedOrder.shippingAddress?.landmark && (
                    <p className="text-amber-800 font-medium">Landmark: {selectedOrder.shippingAddress.landmark}</p>
                  )}
                  <p className="text-gray-700">{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.zipCode}</p>
                  <p className="text-gray-700 font-bold mt-1">Phone: {selectedOrder.shippingAddress?.phone || selectedOrder.user?.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="font-bold uppercase tracking-wider text-gray-500 text-[10px] mb-1">Shipping & Carrier:</p>
                  <p><strong className="text-gray-900">Carrier:</strong> {selectedOrder.carrier || 'Express Courier'}</p>
                  <p><strong className="text-gray-900">Tracking:</strong> {selectedOrder.trackingNumber || 'Pending Dispatch'}</p>
                  <p><strong className="text-gray-900">Payment:</strong> {selectedOrder.paymentMethod || 'Online Prepaid'} ({selectedOrder.paymentStatus})</p>
                </div>
              </div>

              {/* Items to Pack (Checklist format) */}
              <div>
                <p className="font-bold uppercase tracking-wider text-gray-700 text-xs mb-2">Packing Items Checklist:</p>
                <table className="min-w-full border border-gray-200 text-xs">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-200 px-3 py-2 text-center w-10">Packed</th>
                      <th className="border border-gray-200 px-3 py-2 text-left">Item Description</th>
                      <th className="border border-gray-200 px-3 py-2 text-center w-24">Quantity</th>
                      <th className="border border-gray-200 px-3 py-2 text-right w-24">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-200">
                        <td className="border border-gray-200 px-3 py-3 text-center">
                          <div className="w-5 h-5 border-2 border-gray-400 rounded mx-auto"></div>
                        </td>
                        <td className="border border-gray-200 px-3 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.coinImage || getImageUrl(item.coin?.images)}
                              alt={item.coinName}
                              className="w-10 h-10 object-contain rounded border p-0.5 mix-blend-multiply bg-white"
                            />
                            <div>
                              <p className="font-bold text-gray-900 text-sm">{item.coinName}</p>
                              <p className="text-[11px] text-gray-500">
                                {item.coin?.denomination || 'Artifact'} &middot; {item.coin?.era || ''} &middot; SKU: {item.coin?.sku || item.coin?._id?.slice(-6) || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="border border-gray-200 px-3 py-3 text-center font-bold text-base">
                          {item.quantity}
                        </td>
                        <td className="border border-gray-200 px-3 py-3 text-right font-medium">
                          {formatPrice((item.priceAtPurchase || 0) * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total & Packer Signature */}
              <div className="flex justify-between items-end pt-4 border-t border-gray-200 text-xs">
                <div>
                  <p className="text-gray-500">Packer Signature: ______________________</p>
                  <p className="text-gray-400 text-[10px] mt-1">Inspected & packed with numismatic protective capsule/sleeve.</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500">Total Billed: <strong className="text-gray-900 text-sm">{formatPrice(selectedOrder.totalAmount)}</strong></p>
                </div>
              </div>
            </div>

            {/* Fast Workflow Buttons in Packing View */}
            <div className={`border-t px-6 py-4 flex items-center justify-between print:hidden ${isDark ? 'bg-dark-750 border-dark-700' : 'bg-[#FAFAF7] border-gray-200'}`}>
              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Update fulfillment status:</span>
              <div className="flex gap-2">
                {selectedOrder.status === 'confirmed' && (
                  <button
                    onClick={() => handleStatusChange(selectedOrder._id, 'processing')}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-semibold hover:bg-indigo-700"
                  >
                    Mark Processing
                  </button>
                )}
                {selectedOrder.status === 'processing' && (
                  <button
                    onClick={() => handleStatusChange(selectedOrder._id, 'shipped')}
                    className="px-3 py-1.5 bg-purple-600 text-white rounded text-xs font-semibold hover:bg-purple-700"
                  >
                    Mark Shipped
                  </button>
                )}
                {selectedOrder.status === 'shipped' && (
                  <button
                    onClick={() => handleStatusChange(selectedOrder._id, 'delivered')}
                    className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700"
                  >
                    Mark Delivered
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManager;
