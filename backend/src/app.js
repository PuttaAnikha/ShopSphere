const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const env = require('./config/env');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');
const { successResponse } = require('./utils/apiResponse');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const couponRoutes = require('./routes/couponRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const supportRoutes = require('./routes/supportRoutes');
const disputeRoutes = require('./routes/disputeRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const refundRoutes = require('./routes/refundRoutes');
const settlementRoutes = require('./routes/settlementRoutes');
const adminRoutes = require('./routes/adminRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS configuration
const configuredOrigins = [env.CLIENT_URL, ...env.CORS_ORIGINS.split(',')]
  .map((value) => value.trim())
  .filter(Boolean);

const isAllowedOrigin = (origin, callback) => {
  if (!origin || configuredOrigins.includes(origin)) {
    return callback(null, true);
  }

  try {
    const url = new URL(origin);
    return callback(null, ['localhost', '127.0.0.1'].includes(url.hostname));
  } catch {
    return callback(null, false);
  }
};

app.use(
  cors({
    origin: isAllowedOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  })
);

// Rate Limiting (100 requests per 15 mins for general APIs, disabled in test environment)
if (env.NODE_ENV !== 'test') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again after 15 minutes',
      errors: []
    }
  });
  app.use('/api/', limiter);
}

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check API
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED';
  return successResponse(res, 200, 'ShopSphere API is running', {
    status: 'UP',
    database: dbStatus,
    environment: env.NODE_ENV,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// API Routes Mounting
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/sellers', sellerRoutes); // Alias
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/refunds', refundRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);

// Catch-all 404 handler
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

module.exports = app;
