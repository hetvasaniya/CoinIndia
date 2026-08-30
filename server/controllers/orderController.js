const Order = require('../models/Order');
const Coin = require('../models/Coin');
const Payment = require('../models/Payment');
const razorpay = require('../config/razorpay');

const VALID_STATUS_FLOW = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, billingAddress, paymentMethod = 'Razorpay' } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No order items provided' });
    }

    let subtotal = 0;
    const orderItems = [];

    // Verify stock and calculate price server-side
    for (const item of items) {
      const coin = await Coin.findById(item.coin);
      if (!coin || coin.quantity < item.quantity || !coin.isAvailable) {
        return res.status(400).json({ message: `Item ${coin ? coin.name : item.coin} is unavailable or out of stock` });
      }

      const itemTotal = coin.sellingPrice * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        coin: coin._id,
        quantity: item.quantity,
        priceAtPurchase: coin.sellingPrice,
        coinName: coin.name,
        coinImage: coin.images && coin.images.length > 0 ? coin.images[0] : null,
      });
    }

    const tax = Math.round(subtotal * 0.18); // 18% tax
    const totalAmount = subtotal + tax;

    // Create Razorpay Order with a unique receipt ID
    const receiptId = `RCPT-${Date.now().toString().slice(-8)}`;
    const razorpayOptions = {
      amount: Math.round(totalAmount * 100), // in paise
      currency: 'INR',
      receipt: receiptId,
    };

    const razorpayOrder = await razorpay.orders.create(razorpayOptions);

    res.status(200).json({
      razorpayOrder,
      totalAmount,
      subtotal,
      tax,
      orderItems,
      shippingAddress,
      billingAddress,
      paymentMethod,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.coin', 'name images sellingPrice quantity isAvailable denomination era material')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone addresses')
      .populate('items.coin', 'name images sellingPrice quantity isAvailable denomination era material mintMark sku')
      .populate('cancelledBy.user', 'name email')
      .populate('refund.processedBy', 'name email');

    if (order && (order.user._id.toString() === req.user._id.toString() || req.user.role === 'admin')) {
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const { status, paymentStatus, search, page = 1, limit = 100 } = req.query;

    const query = {};

    if (status && status !== 'all') {
      query.status = status.toLowerCase();
    }

    if (paymentStatus && paymentStatus !== 'all') {
      query.paymentStatus = paymentStatus.toLowerCase();
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { orderNumber: searchRegex },
        { razorpayPaymentId: searchRegex },
        { razorpayOrderId: searchRegex },
        { 'shippingAddress.phone': searchRegex },
        { 'shippingAddress.city': searchRegex },
      ];
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .populate('items.coin', 'name images sellingPrice quantity isAvailable denomination era material mintMark sku')
      .populate('cancelledBy.user', 'name email')
      .populate('refund.processedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({
      orders,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)) || 1,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status, trackingNumber, carrier, estimatedDelivery, note } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Rule: Once cancelled, order status permanently becomes Cancelled.
    // It must NOT be possible to confirm, process, ship, or deliver that order afterward.
    if (order.status === 'cancelled') {
      return res.status(400).json({
        message: 'This order is permanently cancelled and cannot be updated to any other status.',
      });
    }

    // If attempting to cancel via status update, redirect to cancel logic
    if (status && status.toLowerCase() === 'cancelled') {
      return cancelOrderInternal(req, res, order);
    }

    if (status) {
      const targetStatus = status.toLowerCase();
      if (!VALID_STATUS_FLOW.includes(targetStatus)) {
        return res.status(400).json({ message: `Invalid status: ${status}` });
      }

      order.status = targetStatus;
      if (!order.statusHistory) order.statusHistory = [];
      order.statusHistory.push({
        status: targetStatus,
        updatedAt: new Date(),
        updatedBy: req.user._id,
        note: note || `Status updated to ${targetStatus} by admin`,
      });
    }

    if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
    if (carrier !== undefined) order.carrier = carrier;
    if (estimatedDelivery !== undefined) order.estimatedDelivery = estimatedDelivery;

    const updatedOrder = await order.save();
    const populated = await Order.findById(updatedOrder._id)
      .populate('user', 'name email phone')
      .populate('items.coin', 'name images sellingPrice quantity isAvailable denomination era material mintMark sku');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Internal cancellation helper
const cancelOrderInternal = async (req, res, order) => {
  try {
    const { reason, refundMethod, refundAmount, notes } = req.body;

    if (order.status === 'cancelled') {
      return res.status(400).json({ message: 'Order is already cancelled' });
    }

    // 1. Mark status as cancelled
    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancellationReason = reason || 'Cancelled by administrator';
    order.cancelledBy = {
      user: req.user?._id,
      role: req.user?.role || 'admin',
      name: req.user?.name || 'Administrator',
    };

    // 2. Restore inventory quantities
    for (const item of order.items) {
      if (item.coin) {
        await Coin.findByIdAndUpdate(item.coin, {
          $inc: { quantity: item.quantity },
          $set: { isAvailable: true },
        });
      }
    }

    // 3. Automated Refund record creation if paid
    if (order.paymentStatus === 'paid') {
      const calcRefundAmount = refundAmount !== undefined ? Number(refundAmount) : order.totalAmount;
      order.refund = {
        amount: calcRefundAmount,
        status: 'pending', // Refund Pending
        method: refundMethod || order.paymentMethod || 'Original Payment Method',
        notes: notes || `Auto-created refund for cancelled order #${order.orderNumber || order._id}`,
        createdAt: new Date(),
      };
    } else {
      order.refund = {
        amount: 0,
        status: 'none',
        method: order.paymentMethod || 'Cash on Delivery',
        notes: 'Unpaid order cancelled. No monetary refund required.',
        createdAt: new Date(),
      };
    }

    // 4. Record in status history
    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({
      status: 'cancelled',
      updatedAt: new Date(),
      updatedBy: req.user?._id,
      note: `Cancelled: ${order.cancellationReason}`,
    });

    const savedOrder = await order.save();
    const populated = await Order.findById(savedOrder._id)
      .populate('user', 'name email phone')
      .populate('items.coin', 'name images sellingPrice quantity isAvailable denomination era material mintMark sku')
      .populate('cancelledBy.user', 'name email')
      .populate('refund.processedBy', 'name email');

    return res.json({
      message: 'Order cancelled successfully and inventory restored to stock.',
      order: populated,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    return cancelOrderInternal(req, res, order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const processRefund = async (req, res) => {
  try {
    const { refundStatus, refundMethod, refundTransactionId, refundNotes, refundAmount } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'cancelled' && order.paymentStatus !== 'paid') {
      return res.status(400).json({ message: 'Refunds can only be processed for cancelled or paid orders.' });
    }

    if (!order.refund) {
      order.refund = {
        amount: order.totalAmount,
        status: 'pending',
        createdAt: new Date(),
      };
    }

    if (refundAmount !== undefined) {
      order.refund.amount = Number(refundAmount);
    }
    if (refundMethod) {
      order.refund.method = refundMethod;
    }
    if (refundTransactionId !== undefined) {
      order.refund.transactionId = refundTransactionId;
    }
    if (refundNotes !== undefined) {
      order.refund.notes = refundNotes;
    }

    if (refundStatus) {
      const validRefundStatuses = ['pending', 'processing', 'refunded', 'failed', 'none'];
      if (!validRefundStatuses.includes(refundStatus.toLowerCase())) {
        return res.status(400).json({ message: `Invalid refund status: ${refundStatus}` });
      }

      order.refund.status = refundStatus.toLowerCase();

      if (refundStatus.toLowerCase() === 'refunded') {
        order.paymentStatus = 'refunded';
        order.refund.processedAt = new Date();
        order.refund.processedBy = req.user._id;

        // Update Payment collection record if exists
        await Payment.findOneAndUpdate(
          { order: order._id },
          {
            $set: {
              status: 'refunded',
              refundId: refundTransactionId || `REF-${Date.now()}`,
              refundAmount: order.refund.amount,
              refundNotes: refundNotes || 'Refund processed by administrator',
            },
          }
        );
      }
    }

    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({
      status: order.status,
      updatedAt: new Date(),
      updatedBy: req.user._id,
      note: `Refund updated: Status=${order.refund.status}, Method=${order.refund.method || 'N/A'}, Txn=${order.refund.transactionId || 'N/A'}`,
    });

    const savedOrder = await order.save();
    const populated = await Order.findById(savedOrder._id)
      .populate('user', 'name email phone')
      .populate('items.coin', 'name images sellingPrice quantity isAvailable denomination era material mintMark sku')
      .populate('cancelledBy.user', 'name email')
      .populate('refund.processedBy', 'name email');

    res.json({
      message: 'Refund updated successfully',
      order: populated,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOrderStats = async (req, res) => {
  try {
    // 1. All orders count
    const totalOrders = await Order.countDocuments();
    const completedOrders = await Order.countDocuments({ status: 'delivered' });
    const pendingOrders = await Order.countDocuments({ status: { $in: ['pending', 'confirmed', 'processing'] } });
    const shippedOrders = await Order.countDocuments({ status: 'shipped' });
    const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });

    // 2. Gross revenue: Sum of totalAmount for all orders where payment was made (paid or refunded)
    const grossResult = await Order.aggregate([
      { $match: { paymentStatus: { $in: ['paid', 'refunded'] } } },
      { $group: { _id: null, grossRevenue: { $sum: '$totalAmount' } } },
    ]);
    const grossRevenue = grossResult.length > 0 ? grossResult[0].grossRevenue : 0;

    // 3. Cancelled Order Amount (cancelled orders that were originally paid or refunded)
    const cancelledResult = await Order.aggregate([
      { $match: { status: 'cancelled', paymentStatus: { $in: ['paid', 'refunded'] } } },
      { $group: { _id: null, cancelledAmount: { $sum: '$totalAmount' } } },
    ]);
    const cancelledOrderAmount = cancelledResult.length > 0 ? cancelledResult[0].cancelledAmount : 0;

    // 4. Refunded Amount (actually completed refunds)
    const refundedResult = await Order.aggregate([
      { $match: { 'refund.status': 'refunded' } },
      { $group: { _id: null, refundedAmount: { $sum: '$refund.amount' } } },
    ]);
    const refundedAmount = refundedResult.length > 0 ? refundedResult[0].refundedAmount : 0;

    // 5. Net Revenue: Active non-cancelled paid revenue (Gross Revenue - Cancelled Order Amount)
    const netResult = await Order.aggregate([
      { $match: { paymentStatus: 'paid', status: { $ne: 'cancelled' } } },
      { $group: { _id: null, netRevenue: { $sum: '$totalAmount' } } },
    ]);
    const netRevenue = netResult.length > 0 ? netResult[0].netRevenue : Math.max(0, grossRevenue - cancelledOrderAmount);

    res.json({
      grossRevenue,
      cancelledOrderAmount,
      refundedAmount,
      netRevenue,
      totalOrders,
      completedOrders,
      pendingOrders,
      shippedOrders,
      cancelledOrders,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  processRefund,
  getOrderStats,
};
