const crypto = require('crypto');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Coin = require('../models/Coin');
const Cart = require('../models/Cart');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { orderConfirmationEmail } = require('../utils/emailTemplates');

const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
      items,
      shippingAddress,
      billingAddress
    } = req.body;

    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed: Invalid signature' });
    }

    let order = null;

    // Check if order was already saved
    if (orderId) {
      order = await Order.findById(orderId).populate('user', 'name email');
    } else if (razorpay_order_id) {
      order = await Order.findOne({ razorpayOrderId: razorpay_order_id }).populate('user', 'name email');
    }

    if (order) {
      order.paymentStatus = 'paid';
      order.status = 'confirmed';
      order.razorpayPaymentId = razorpay_payment_id;
      await order.save();
    } else {
      // Create new Order upon verified payment
      if (!items || items.length === 0) {
        return res.status(400).json({ message: 'No items provided for order creation' });
      }

      let subtotal = 0;
      const orderItems = [];

      for (const item of items) {
        const coin = await Coin.findById(item.coin);
        if (!coin) {
          return res.status(400).json({ message: `Coin item ${item.coin} not found` });
        }

        const itemTotal = coin.sellingPrice * item.quantity;
        subtotal += itemTotal;

        orderItems.push({
          coin: coin._id,
          quantity: item.quantity,
          priceAtPurchase: coin.sellingPrice,
          coinName: coin.name,
          coinImage: coin.images && coin.images.length > 0 ? coin.images[0] : null
        });
      }

      const tax = Math.round(subtotal * 0.18);
      const totalAmount = subtotal + tax;

      order = new Order({
        user: req.user._id,
        items: orderItems,
        subtotal,
        tax,
        totalAmount,
        shippingAddress: shippingAddress || {},
        billingAddress: billingAddress || shippingAddress || {},
        status: 'confirmed',
        paymentStatus: 'paid',
        paymentMethod: req.body.paymentMethod || 'Razorpay',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id
      });

      await order.save();
      order = await Order.findById(order._id).populate('user', 'name email');
    }

    // Record Payment
    await Payment.create({
      order: order._id,
      user: req.user._id,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      amount: order.totalAmount,
      status: 'captured'
    });

    // Update inventory stock
    for (const item of order.items) {
      await Coin.findByIdAndUpdate(item.coin, {
        $inc: { quantity: -item.quantity }
      });
      
      const coin = await Coin.findById(item.coin);
      if (coin && coin.quantity <= 0) {
        coin.isAvailable = false;
        await coin.save();
      }
    }

    // Clear cart for the user
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    // Send confirmation email
    try {
      const recipientEmail = order.user?.email || req.user.email;
      const recipientName = order.user?.name || req.user.name;
      if (recipientEmail) {
        await sendEmail({
          to: recipientEmail,
          subject: `Order Confirmation - ${order.orderNumber}`,
          html: orderConfirmationEmail(order.orderNumber, recipientName, order.totalAmount)
        });
      }
    } catch (err) {
      console.error('Failed to send order confirmation email', err);
    }

    res.json({ message: 'Payment verified successfully', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const handleWebhook = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  
  const shasum = crypto.createHmac('sha256', secret);
  shasum.update(JSON.stringify(req.body));
  const digest = shasum.digest('hex');

  if (digest === req.headers['x-razorpay-signature']) {
    const event = req.body.event;
    
    if (event === 'payment.captured') {
      console.log('Payment captured via webhook');
    }
    
    res.json({ status: 'ok' });
  } else {
    res.status(400).json({ message: 'Invalid signature' });
  }
};

const demoCheckout = async (req, res) => {
  try {
    const { items, shippingAddress, billingAddress } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items provided for order' });
    }

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const coin = await Coin.findById(item.coin);
      if (!coin || !coin.isAvailable || coin.quantity < item.quantity) {
        return res.status(400).json({ message: `Item ${coin ? coin.name : item.coin} is unavailable or out of stock` });
      }

      const itemTotal = coin.sellingPrice * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        coin: coin._id,
        quantity: item.quantity,
        priceAtPurchase: coin.sellingPrice,
        coinName: coin.name,
        coinImage: coin.images && coin.images.length > 0 ? coin.images[0] : null
      });
    }

    const tax = Math.round(subtotal * 0.18);
    const totalAmount = subtotal + tax;

    const mockOrderId = `DEMO-ORDER-${Date.now()}`;
    const mockPaymentId = `DEMO-PAY-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const order = new Order({
      user: req.user._id,
      items: orderItems,
      subtotal,
      tax,
      totalAmount,
      shippingAddress: shippingAddress || {},
      billingAddress: billingAddress || shippingAddress || {},
      status: 'confirmed',
      paymentStatus: 'paid',
      paymentMethod: req.body.paymentMethod || 'Demo Payment',
      razorpayOrderId: mockOrderId,
      razorpayPaymentId: mockPaymentId
    });

    await order.save();
    const savedOrder = await Order.findById(order._id).populate('user', 'name email');

    // Record Payment in database
    await Payment.create({
      order: savedOrder._id,
      user: req.user._id,
      razorpayOrderId: mockOrderId,
      razorpayPaymentId: mockPaymentId,
      razorpaySignature: 'DEMO_SIGNATURE_VERIFIED',
      amount: savedOrder.totalAmount,
      status: 'captured'
    });

    // Update coin stock
    for (const item of savedOrder.items) {
      await Coin.findByIdAndUpdate(item.coin, {
        $inc: { quantity: -item.quantity }
      });
      
      const coin = await Coin.findById(item.coin);
      if (coin && coin.quantity <= 0) {
        coin.isAvailable = false;
        await coin.save();
      }
    }

    // Clear user cart
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    // Send confirmation email if configured
    try {
      const recipientEmail = savedOrder.user?.email || req.user.email;
      const recipientName = savedOrder.user?.name || req.user.name;
      if (recipientEmail) {
        await sendEmail({
          to: recipientEmail,
          subject: `Order Confirmation - ${savedOrder.orderNumber}`,
          html: orderConfirmationEmail(savedOrder.orderNumber, recipientName, savedOrder.totalAmount)
        });
      }
    } catch (err) {
      console.error('Failed to send order confirmation email', err);
    }

    res.status(201).json({
      message: 'Demo payment completed successfully',
      order: savedOrder
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id }).sort({ createdAt: -1 }).populate('order', 'orderNumber totalAmount');
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { verifyPayment, handleWebhook, getPaymentHistory, demoCheckout };
