import { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { useTheme } from '../../context/ThemeContext';
import { 
  formatPrice, 
  formatDate, 
  getRefundStatusColor, 
  getImageUrl 
} from '../../utils/helpers';
import toast from 'react-hot-toast';
import { 
  FiSearch, FiFilter, FiRefreshCw, FiDollarSign, FiCheckCircle, 
  FiClock, FiAlertCircle, FiUser, FiCreditCard, FiPackage, 
  FiArrowRight, FiShield, FiTag, FiFileText, FiInfo, FiRotateCcw
} from 'react-icons/fi';

const RefundManager = () => {
  const { isDark } = useTheme();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Refund Form State
  const [refundForm, setRefundForm] = useState({
    refundStatus: 'refunded',
    refundMethod: 'Original Payment Method',
    refundAmount: 0,
    refundTransactionId: '',
    refundNotes: '',
  });

  useEffect(() => {
    fetchRefundsAndStats();
  }, [statusFilter, methodFilter]);

  const fetchRefundsAndStats = async () => {
    setLoading(true);
    try {
      const [refundsData, statsData] = await Promise.all([
        adminService.getRefunds({
          status: statusFilter !== 'all' ? statusFilter : undefined,
          method: methodFilter !== 'all' ? methodFilter : undefined,
        }),
        adminService.getRefundStats().catch(() => null),
      ]);

      const list = refundsData?.orders || (Array.isArray(refundsData) ? refundsData : []);
      setOrders(list);
      if (statsData) {
        setStats(statsData);
      }
    } catch (error) {
      toast.error('Failed to load refund records');
    } finally {
      setLoading(false);
    }
  };

  const openRefundModal = (order) => {
    setSelectedOrder(order);
    const existingAmount = order.refund?.amount > 0 ? order.refund.amount : order.totalAmount;
    setRefundForm({
      refundStatus: order.refund?.status && order.refund.status !== 'none' ? order.refund.status : 'refunded',
      refundMethod: order.refund?.method || order.paymentMethod || 'Original Payment Method',
      refundAmount: existingAmount,
      refundTransactionId: order.refund?.transactionId || `REF-${Date.now().toString().slice(-6)}`,
      refundNotes: order.refund?.notes || 'Refund processed via admin refund portal',
    });
    setModalOpen(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const numAmount = Number(refundForm.refundAmount);
    if (numAmount <= 0) {
      toast.error('Refund amount must be greater than 0');
      return;
    }
    if (numAmount > selectedOrder.totalAmount) {
      toast.error(`Refund amount cannot exceed total paid amount (${formatPrice(selectedOrder.totalAmount)})`);
      return;
    }

    setConfirmOpen(true);
  };

  const executeProcessRefund = async () => {
    if (!selectedOrder) return;
    setSubmitting(true);
    try {
      const res = await adminService.processRefund(selectedOrder._id, refundForm);
      toast.success(`Refund status updated to ${refundForm.refundStatus.toUpperCase()}`);
      setConfirmOpen(false);
      setModalOpen(false);
      fetchRefundsAndStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process refund');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtering & Sorting Logic
  const filteredOrders = orders
    .filter((order) => {
      const term = search.toLowerCase().trim();
      if (!term) return true;
      const orderIdMatch = (order._id && order._id.toLowerCase().includes(term)) ||
        (order.orderNumber && order.orderNumber.toLowerCase().includes(term));
      const userMatch = (order.user?.name && order.user.name.toLowerCase().includes(term)) ||
        (order.user?.email && order.user.email.toLowerCase().includes(term));
      const txnMatch = order.refund?.transactionId && order.refund.transactionId.toLowerCase().includes(term);
      const phoneMatch = order.shippingAddress?.phone && order.shippingAddress.phone.includes(term);
      return orderIdMatch || userMatch || txnMatch || phoneMatch;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'amount_high') return (b.refund?.amount || b.totalAmount) - (a.refund?.amount || a.totalAmount);
      if (sortBy === 'amount_low') return (a.refund?.amount || a.totalAmount) - (b.refund?.amount || b.totalAmount);
      return 0;
    });

  const cardBg = isDark ? 'bg-dark-800 border-dark-700 text-white' : 'bg-white border-gray-200 text-gray-900';
  const tableHeaderBg = isDark ? 'bg-dark-900 text-gray-400' : 'bg-[#FAFAF7] text-gray-500';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-serif ${isDark ? 'text-white' : 'text-gray-900'}`}>Refund Management</h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Track, process, and audit refunds for cancelled paid orders.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchRefundsAndStats}
            className={`p-2.5 border rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${
              isDark ? 'border-dark-700 bg-dark-800 text-gray-300 hover:bg-dark-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
            title="Refresh Refunds"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Metric Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pending Refunds */}
          <div className={`p-4 border rounded-xl shadow-sm ${
            isDark ? 'bg-dark-800 border-amber-500/20' : 'bg-amber-50/50 border-amber-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Pending Refunds</span>
              <FiClock className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-2xl font-serif font-bold text-amber-900 mt-2">{stats.pendingCount || 0} orders</p>
            <p className="text-xs text-amber-700 mt-1 font-medium">{formatPrice(stats.pendingTotal || 0)} awaiting payout</p>
          </div>

          {/* Processing Refunds */}
          <div className={`p-4 border rounded-xl shadow-sm ${
            isDark ? 'bg-dark-800 border-indigo-500/20' : 'bg-indigo-50/50 border-indigo-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700">Processing Refunds</span>
              <FiRotateCcw className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-2xl font-serif font-bold text-indigo-900 mt-2">{stats.processingCount || 0} orders</p>
            <p className="text-xs text-indigo-700 mt-1 font-medium">{formatPrice(stats.processingTotal || 0)} in bank queue</p>
          </div>

          {/* Completed Refunds */}
          <div className={`p-4 border rounded-xl shadow-sm ${
            isDark ? 'bg-dark-800 border-emerald-500/20' : 'bg-emerald-50/50 border-emerald-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Completed Refunds</span>
              <FiCheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-2xl font-serif font-bold text-emerald-900 mt-2">{stats.completedCount || 0} orders</p>
            <p className="text-xs text-emerald-700 mt-1 font-medium">Successfully refunded</p>
          </div>

          {/* Total Refunded Amount */}
          <div className={`p-4 border rounded-xl shadow-sm ${
            isDark ? 'bg-dark-800 border-purple-500/20' : 'bg-purple-50/50 border-purple-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-700">Total Refunded Amount</span>
              <FiDollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-serif font-bold text-purple-900 mt-2">{formatPrice(stats.completedTotal || 0)}</p>
            <p className="text-xs text-purple-700 mt-1 font-medium">Lifetime payout volume</p>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className={`p-4 border rounded-xl shadow-sm space-y-4 ${cardBg}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status filter tabs */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { key: 'all', label: 'All Refund Statuses' },
              { key: 'pending', label: 'Pending' },
              { key: 'processing', label: 'Processing' },
              { key: 'refunded', label: 'Completed (Refunded)' },
              { key: 'failed', label: 'Failed' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  statusFilter === tab.key
                    ? 'bg-gold-500 text-dark-900 font-bold shadow-sm'
                    : isDark ? 'bg-dark-700 text-gray-300 hover:bg-dark-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search, Payment Method, & Sort controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-56">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search customer, order #, txn ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full pl-9 pr-3 py-1.5 border rounded-lg text-xs focus:ring-1 focus:ring-gold-500 ${
                  isDark ? 'bg-dark-700 border-dark-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className={`px-2.5 py-1.5 border rounded-lg text-xs focus:ring-1 focus:ring-gold-500 ${
                isDark ? 'bg-dark-700 border-dark-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">All Payment Methods</option>
              <option value="Original Payment Method">Original Payment Method</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Manual / Other">Manual / Other</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`px-2.5 py-1.5 border rounded-lg text-xs focus:ring-1 focus:ring-gold-500 ${
                isDark ? 'bg-dark-700 border-dark-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount_high">Amount: High to Low</option>
              <option value="amount_low">Amount: Low to High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Refunds Table */}
      <div className={`border rounded-xl shadow-sm overflow-hidden ${cardBg}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className={tableHeaderBg}>
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Customer</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Order ID</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Order Date</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Paid Amount</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Payment Method</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Cancellation Reason</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Refund Amount</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Refund Status</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-dark-700' : 'divide-gray-200'}`}>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-sm text-gray-500">
                    {loading ? 'Loading refund records...' : 'No matching refundable orders found.'}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const displayId = order.orderNumber || `#${order._id.substring(order._id.length - 8).toUpperCase()}`;
                  const currentRefundStatus = order.refund?.status || 'pending';
                  const refundAmt = order.refund?.amount > 0 ? order.refund.amount : order.totalAmount;

                  return (
                    <tr
                      key={order._id}
                      className={`transition-colors ${isDark ? 'hover:bg-dark-700/50' : 'hover:bg-gray-50'}`}
                    >
                      {/* Customer */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold">{order.user?.name || 'Guest Customer'}</div>
                        <div className="text-xs text-gray-500">{order.user?.email || order.shippingAddress?.phone || 'N/A'}</div>
                      </td>

                      {/* Order ID */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono font-bold text-gold-500">{displayId}</span>
                        <span className="text-xs text-gray-500 block font-mono">#{order._id.slice(-6)}</span>
                      </td>

                      {/* Order Date */}
                      <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>

                      {/* Paid Amount */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-emerald-600">{formatPrice(order.totalAmount)}</span>
                      </td>

                      {/* Payment Method */}
                      <td className="px-5 py-4 whitespace-nowrap text-xs">
                        <span className="font-medium">{order.paymentMethod || 'Razorpay'}</span>
                        {order.razorpayPaymentId && (
                          <span className="text-[10px] text-gray-400 block font-mono">{order.razorpayPaymentId}</span>
                        )}
                      </td>

                      {/* Cancellation Reason */}
                      <td className="px-5 py-4 whitespace-nowrap text-xs max-w-xs truncate" title={order.cancellationReason}>
                        <span className="text-red-500 font-medium">{order.cancellationReason || 'Admin cancelled'}</span>
                      </td>

                      {/* Refund Amount */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold font-mono">{formatPrice(refundAmt)}</span>
                      </td>

                      {/* Refund Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full capitalize ${getRefundStatusColor(currentRefundStatus)}`}>
                          {currentRefundStatus}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 whitespace-nowrap text-right text-xs font-medium">
                        <button
                          onClick={() => openRefundModal(order)}
                          className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all shadow-sm ${
                            currentRefundStatus === 'refunded'
                              ? isDark ? 'bg-dark-700 text-gray-300 hover:bg-dark-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              : 'bg-gradient-to-r from-gold-600 to-gold-400 text-dark-900 hover:from-gold-500 hover:to-gold-300'
                          }`}
                        >
                          {currentRefundStatus === 'refunded' ? 'View Details' : 'Process Refund'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* REFUND PROCESS & DETAIL MODAL */}
      {/* ========================================================================= */}
      {modalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border ${
            isDark ? 'bg-dark-800 border-dark-700 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            {/* Modal Header */}
            <div className={`sticky top-0 border-b px-6 py-4 flex items-center justify-between z-10 ${
              isDark ? 'bg-dark-900 border-dark-700' : 'bg-[#FAFAF7] border-gray-200'
            }`}>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-serif font-bold">
                    Refund for Order {selectedOrder.orderNumber || `#${selectedOrder._id.slice(-8).toUpperCase()}`}
                  </h2>
                  <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full uppercase ${getRefundStatusColor(refundForm.refundStatus)}`}>
                    {refundForm.refundStatus}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Customer: {selectedOrder.user?.name} &middot; Billed: {formatPrice(selectedOrder.totalAmount)}
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
              {/* Order Summary & Products Preview */}
              <div className={`p-4 rounded-xl border text-xs space-y-3 ${
                isDark ? 'bg-dark-900/60 border-dark-700' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="font-bold uppercase tracking-wider text-gray-500">Order & Payment Breakdown</span>
                  <span className="text-emerald-500 font-semibold uppercase">Paid via {selectedOrder.paymentMethod || 'Online'}</span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-gray-500 block">Original Order Total:</span>
                    <span className="font-bold text-sm">{formatPrice(selectedOrder.totalAmount)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Paid Amount:</span>
                    <span className="font-bold text-sm text-emerald-500">{formatPrice(selectedOrder.totalAmount)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Cancellation Date:</span>
                    <span className="font-medium">{formatDate(selectedOrder.cancelledAt || selectedOrder.updatedAt)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Cancelled By:</span>
                    <span className="font-medium">{selectedOrder.cancelledBy?.name || 'Administrator'}</span>
                  </div>
                </div>

                <div className="pt-2 border-t text-red-500 font-medium">
                  <strong>Reason for Cancellation:</strong> {selectedOrder.cancellationReason || 'Customer requested / Admin cancelled'}
                </div>

                {/* Ordered Items Summary */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-gray-500 font-semibold block">Purchased Items ({selectedOrder.items?.length}):</span>
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className={`flex items-center justify-between p-2 rounded border ${
                      isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        <img
                          src={item.coinImage || getImageUrl(item.coin?.images)}
                          alt={item.coinName}
                          className="w-7 h-7 object-contain rounded"
                        />
                        <span className="font-medium">{item.coinName}</span>
                      </div>
                      <span className="font-mono">{item.quantity} × {formatPrice(item.priceAtPurchase || 0)} = {formatPrice((item.priceAtPurchase || 0) * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Refund Configuration Inputs */}
              <div className="space-y-4 text-xs">
                <h3 className="text-sm font-bold border-b pb-2 uppercase tracking-wider text-gold-500">
                  Refund Processing Configuration
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Refund Amount (Capped at total paid) */}
                  <div>
                    <label className="font-bold block mb-1">
                      Refund Amount (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max={selectedOrder.totalAmount}
                      value={refundForm.refundAmount}
                      onChange={(e) => setRefundForm({ ...refundForm, refundAmount: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg font-bold text-sm ${
                        isDark ? 'bg-dark-700 border-dark-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <p className="text-[11px] text-gray-500 mt-1">
                      Original Paid: <strong>{formatPrice(selectedOrder.totalAmount)}</strong>. Capped to prevent over-refunding.
                    </p>
                  </div>

                  {/* Refund Method */}
                  <div>
                    <label className="font-bold block mb-1">Refund Method</label>
                    <select
                      value={refundForm.refundMethod}
                      onChange={(e) => setRefundForm({ ...refundForm, refundMethod: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg text-xs ${
                        isDark ? 'bg-dark-700 border-dark-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="Original Payment Method">Original Payment Method (Razorpay / UPI)</option>
                      <option value="UPI">UPI Transfer</option>
                      <option value="Bank Transfer">Bank Transfer (NEFT / IMPS)</option>
                      <option value="Manual / Other">Manual / Other Method</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Refund Status */}
                  <div>
                    <label className="font-bold block mb-1">Refund Lifecycle Status</label>
                    <select
                      value={refundForm.refundStatus}
                      onChange={(e) => setRefundForm({ ...refundForm, refundStatus: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg text-xs font-semibold ${
                        isDark ? 'bg-dark-700 border-dark-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="pending">Pending (Queued)</option>
                      <option value="processing">Processing (Initiated)</option>
                      <option value="refunded">Refunded (Completed)</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>

                  {/* Refund Transaction ID */}
                  <div>
                    <label className="font-bold block mb-1">Transaction / UTR / Reference ID</label>
                    <input
                      type="text"
                      placeholder="e.g. UTR9283749102 or rzp_refund_123"
                      value={refundForm.refundTransactionId}
                      onChange={(e) => setRefundForm({ ...refundForm, refundTransactionId: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg font-mono text-xs ${
                        isDark ? 'bg-dark-700 border-dark-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                </div>

                {/* Admin Notes */}
                <div>
                  <label className="font-bold block mb-1">Admin Remarks / Audit Notes</label>
                  <textarea
                    rows="2"
                    placeholder="Enter audit remarks or customer communication details..."
                    value={refundForm.refundNotes}
                    onChange={(e) => setRefundForm({ ...refundForm, refundNotes: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg text-xs ${
                      isDark ? 'bg-dark-700 border-dark-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div className="pt-4 border-t flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className={`px-4 py-2 border rounded-lg text-xs font-medium ${
                    isDark ? 'border-dark-700 hover:bg-dark-700' : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-gold-600 to-gold-400 text-dark-900 rounded-lg text-xs font-bold hover:from-gold-500 hover:to-gold-300 shadow-md"
                >
                  Save & Update Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFIRMATION DIALOG */}
      {/* ========================================================================= */}
      {confirmOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`rounded-xl shadow-2xl max-w-md w-full border p-6 space-y-4 ${
            isDark ? 'bg-dark-800 border-dark-700 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex items-center gap-3 text-gold-500 border-b pb-3">
              <FiShield className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-lg font-bold">Confirm Refund Execution</h3>
            </div>

            <div className="text-xs space-y-2 leading-relaxed">
              <p>You are about to update the refund status for <strong>Order #{selectedOrder.orderNumber || selectedOrder._id.slice(-8)}</strong>:</p>
              <div className={`p-3 rounded-lg border font-mono ${
                isDark ? 'bg-dark-900 border-dark-700' : 'bg-gray-50 border-gray-200'
              }`}>
                <p>• Refund Amount: <strong>{formatPrice(refundForm.refundAmount)}</strong></p>
                <p>• Target Status: <strong className="uppercase text-gold-500">{refundForm.refundStatus}</strong></p>
                <p>• Method: <strong>{refundForm.refundMethod}</strong></p>
              </div>
              <p className="text-gray-500">This action will be recorded in the order history and revenue audit log.</p>
            </div>

            <div className="pt-3 border-t flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={submitting}
                className={`px-4 py-2 border rounded-lg text-xs font-medium ${
                  isDark ? 'border-dark-700 hover:bg-dark-700' : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                Go Back
              </button>
              <button
                onClick={executeProcessRefund}
                disabled={submitting}
                className="px-5 py-2 bg-gold-500 text-dark-900 rounded-lg text-xs font-bold hover:bg-gold-400 shadow-md flex items-center gap-2"
              >
                {submitting ? 'Processing...' : 'Confirm & Execute'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefundManager;
