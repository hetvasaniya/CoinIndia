const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderNumber: { type: String, unique: true },
    items: [
      {
        coin: { type: mongoose.Schema.Types.ObjectId, ref: 'Coin', required: true },
        quantity: { type: Number, required: true },
        priceAtPurchase: { type: Number, required: true },
        coinName: { type: String, required: true },
        coinImage: { type: String },
      },
    ],
    totalAmount: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    shippingAddress: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
      landmark: String,
      phone: String,
    },
    billingAddress: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
      landmark: String,
      phone: String,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      default: 'Razorpay',
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    trackingNumber: { type: String },
    carrier: { type: String },
    estimatedDelivery: { type: Date },
    // Cancellation details
    cancelledAt: { type: Date },
    cancellationReason: { type: String },
    cancelledBy: {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      role: { type: String, enum: ['admin', 'customer', 'system'], default: 'admin' },
      name: String,
    },
    // Refund details
    refund: {
      amount: { type: Number, default: 0 },
      status: {
        type: String,
        enum: ['none', 'pending', 'processing', 'refunded', 'failed'],
        default: 'none',
      },
      method: { type: String },
      transactionId: { type: String },
      notes: { type: String },
      createdAt: { type: Date },
      processedAt: { type: Date },
      processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    statusHistory: [
      {
        status: { type: String },
        updatedAt: { type: Date, default: Date.now },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        note: { type: String },
      },
    ],
  },
  { timestamps: true }
);

orderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    this.orderNumber = `IND-${year}-${random}`;
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
