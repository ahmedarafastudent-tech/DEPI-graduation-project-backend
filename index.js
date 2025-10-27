const express = require('express');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const db = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const subcategoryRoutes = require('./routes/subcategoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const cartRoutes = require('./routes/cartRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');
const supportRoutes = require('./routes/supportRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const returnsRoutes = require('./routes/returnsRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const couponRoutes = require('./routes/couponRoutes');
const shippingRoutes = require('./routes/shippingRoutes');
const taxRoutes = require('./routes/taxRoutes');

dotenv.config();
// Connect to DB only when not running tests. Tests use an in-memory MongoDB.
if (process.env.NODE_ENV !== 'test') {
  db.connectDB();
}

const app = express();

// Security Headers
app.use(helmet());
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// CORS
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Total-Count'],
    credentials: true,
    maxAge: 600, // 10 minutes
  })
);

// Body Parser
app.use(express.json({ limit: '10kb' })); // Body limit is 10kb

// Rate Limiting
const createLimiter = () =>
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 requests per windowMs (tests expect this)
  });

let limiter = createLimiter();
// Always enable the rate limiter; tests rely on it and we reset it between tests by swapping middleware
app.use('/api', (req, res, next) => limiter(req, res, next));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/subcategories', subcategoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/returns', returnsRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/tax', taxRoutes);

// Attach error handlers (must be last)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Start server only when this file is run directly (not required by tests)
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () =>
    console.log(`Server running on http://localhost:${PORT}`)
  );
}

// Expose a helper to reset the rate limiter (used by tests to avoid bleed)
app.resetRateLimit = () => {
  try {
    // recreate the limiter instance so the internal store is fresh
    limiter = createLimiter();
  } catch (err) {
    // no-op
  }
};

// Export the app and also attach it as a property to support different import styles in tests
module.exports = app;
module.exports.app = app;
