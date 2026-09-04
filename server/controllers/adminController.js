const User = require('../models/User');
const Order = require('../models/Order');
const Coin = require('../models/Coin');
const Category = require('../models/Category');
const Country = require('../models/Country');
const Mint = require('../models/Mint');

const getDashboardStats = async (req, res) => {
  try {
    const totalCoins = await Coin.countDocuments();
    const totalCategories = await Category.countDocuments();
    const totalCountries = await Country.countDocuments();
    const totalMints = await Mint.countDocuments();
    const totalUsers = await User.countDocuments();

    // Order counts
    const totalOrders = await Order.countDocuments();
    const completedOrders = await Order.countDocuments({ status: 'delivered' });
    const pendingOrdersCount = await Order.countDocuments({ status: { $in: ['pending', 'confirmed', 'processing'] } });
    const shippedOrdersCount = await Order.countDocuments({ status: 'shipped' });
    const cancelledOrdersCount = await Order.countDocuments({ status: 'cancelled' });

    // Revenue calculations
    // 1. Gross revenue: All orders paid/confirmed
    const grossResult = await Order.aggregate([
      { $match: { paymentStatus: { $in: ['paid', 'refunded'] } } },
      { $group: { _id: null, grossRevenue: { $sum: '$totalAmount' } } },
    ]);
    const grossRevenue = grossResult.length > 0 ? grossResult[0].grossRevenue : 0;

    // 2. Cancelled paid order amount
    const cancelledResult = await Order.aggregate([
      { $match: { status: 'cancelled', paymentStatus: { $in: ['paid', 'refunded'] } } },
      { $group: { _id: null, cancelledAmount: { $sum: '$totalAmount' } } },
    ]);
    const cancelledOrderAmount = cancelledResult.length > 0 ? cancelledResult[0].cancelledAmount : 0;

    // 3. Refunded amount
    const refundedResult = await Order.aggregate([
      { $match: { 'refund.status': 'refunded' } },
      { $group: { _id: null, refundedAmount: { $sum: '$refund.amount' } } },
    ]);
    const refundedAmount = refundedResult.length > 0 ? refundedResult[0].refundedAmount : 0;

    // 4. Net revenue (excludes cancelled orders and refunds)
    const netResult = await Order.aggregate([
      { $match: { paymentStatus: 'paid', status: { $ne: 'cancelled' } } },
      { $group: { _id: null, netRevenue: { $sum: '$totalAmount' } } },
    ]);
    const netRevenue = netResult.length > 0 ? netResult[0].netRevenue : Math.max(0, grossRevenue - cancelledOrderAmount);

    const lowStock = await Coin.find({ quantity: { $lt: 5 } }).select('name quantity images sellingPrice sku');
    const recentCoins = await Coin.find().sort({ createdAt: -1 }).limit(5).populate('category country mint');
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('user', 'name email');

    // Day-to-day order and revenue analytics (Last 7 days)
    const daysCount = 7;
    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - (daysCount - 1));
    startDate.setHours(0, 0, 0, 0);

    const dailyAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          totalOrders: { $sum: 1 },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] }
          },
          revenue: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$paymentStatus", "paid"] }, { $ne: ["$status", "cancelled"] }] },
                "$totalAmount",
                0
              ]
            }
          }
        }
      }
    ]);

    const dailyMap = {};
    dailyAgg.forEach(item => {
      dailyMap[item._id] = item;
    });

    const dailyAnalytics = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      
      const found = dailyMap[key] || { totalOrders: 0, deliveredOrders: 0, revenue: 0 };
      dailyAnalytics.push({
        date: key,
        dayName,
        label: `${dayName}, ${dayNum}`,
        shortLabel: dayNum,
        orders: found.totalOrders || 0,
        revenue: found.revenue || 0,
        deliveredOrders: found.deliveredOrders || 0
      });
    }

    res.json({
      totalCoins,
      totalOrders,
      completedOrders,
      pendingOrdersCount,
      shippedOrdersCount,
      cancelledOrdersCount,
      totalRevenue: netRevenue, // Keep totalRevenue as netRevenue for compatibility
      grossRevenue,
      cancelledOrderAmount,
      refundedAmount,
      netRevenue,
      totalCategories,
      totalCountries,
      totalMints,
      totalUsers,
      lowStock,
      recentCoins,
      recentOrders,
      dailyAnalytics,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      if (req.body.role) {
        user.role = req.body.role.toLowerCase() === 'admin' ? 'admin' : 'customer';
      }
      if (req.body.isActive !== undefined) user.isActive = req.body.isActive;

      const updatedUser = await user.save();
      
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getInventory = async (req, res) => {
  try {
    const inventory = await Coin.find({}).select('name sku quantity sellingPrice isAvailable images category').populate('category', 'name');
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getUsers,
  updateUser,
  getInventory
};
