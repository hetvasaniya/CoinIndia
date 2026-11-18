const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const path = require('path');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Required for Render / reverse proxy
app.set('trust proxy', 1);

// ================================
// Middleware
// ================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ================================
// CORS Configuration
// ================================

// Allowed frontend origins (development and production)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : null,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without Origin header (Postman, server-to-server, mobile, etc.)
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/$/, '');
      if (allowedOrigins.includes(normalizedOrigin) || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Block unauthorized origins
      return callback(
        new Error(`CORS policy: Origin ${origin} is not allowed`)
      );
    },

    // Required for cookies / authentication
    credentials: true,
  })
);

// ================================
// Routes
// ================================

const authRoutes = require('./routes/authRoutes');
const coinRoutes = require('./routes/coinRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const countryRoutes = require('./routes/countryRoutes');
const mintRoutes = require('./routes/mintRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const aiCoinRoutes = require('./routes/aiCoinRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const supportRoutes = require('./routes/supportRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

// Static uploads
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/coins', coinRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/countries', countryRoutes);
app.use('/api/mints', mintRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/ai-coins', aiCoinRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/reviews', reviewRoutes);

// ================================
// Error Handling
// ================================
app.use(notFound);
app.use(errorHandler);

// ================================
// Start Server
// ================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running in ${
      process.env.NODE_ENV || 'development'
    } mode on port ${PORT}`
  );

  console.log('Allowed CORS origins:', allowedOrigins);
});
