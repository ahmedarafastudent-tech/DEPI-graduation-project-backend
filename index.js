const express = require('express');
const dotenv = require('dotenv');
const { body } = require('express-validator');
const sanitizeHTML = require('sanitize-html');
const isValidEmail = require('validator/lib/isEmail');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const morganLogger = require('./middleware/morganLogger');

dotenv.config();

// Create Express app
const app = express();

// Ensure correct client IP behind proxies and set BEFORE security middlewares
app.set('trust proxy', true);

// --------------------------
// Consolidated security setup
// --------------------------
const securityMiddleware = require('./middleware/security');
securityMiddleware(app);
// --------------------------

// Body Parser
app.use(express.json({ limit: '10kb' })); // Body limit is 10kb
app.use(morganLogger);

// --- Added: safe test-only rate limiter reset helper ---
// Expose a helper to reset the rate limiter (used by tests to avoid bleed).
// This is a no-op in production and only manipulates in-memory tracking used
// by the test harness or in-memory rate-limit implementations.
app.resetRateLimit = async () => {
  try {
    if (process.env.NODE_ENV !== 'test') return;

    // If the security middleware stored rate limiters on app.locals, clear them.
    if (app.locals && app.locals.rateLimiters) {
      // Each limiter may expose `resetAll` or similar — call if present.
      for (const limiter of app.locals.rateLimiters) {
        if (typeof limiter.resetAll === 'function') {
          try { limiter.resetAll(); } catch (_) {}
        } else if (limiter && limiter.store && typeof limiter.store.clear === 'function') {
          try { limiter.store.clear(); } catch (_) {}
        }
      }
      // Also clear any generic tracking object used by tests
      app.locals.rateLimitTracking = {};
    }
  } catch (err) {
    // swallow errors to avoid affecting test cleanup
    // eslint-disable-next-line no-console
    console.warn('app.resetRateLimit: cleanup failed', err.message || err);
  }
};
// --- end added helper ---

// Import route modules and error handlers
// (kept here to ensure security middleware is initialized before routes)
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

const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const db = require('./config/db');

// Environment helpers used on startup logging
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;

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

// Start server and connect DB only when this file is run directly (not required by tests)
if (require.main === module) {
  const validateEnv = require('./config/validateEnv');
  (async () => {
    try {
      // Log resolved URLs (useful for deployment verification)
      console.log('\nResolved URLs:');
      console.log('- Frontend:', FRONTEND_URL);
      console.log('- Backend:', BACKEND_URL);
      if (process.env.CORS_ORIGINS) {
        console.log('- CORS Origins:', process.env.CORS_ORIGINS.split(',').join(', '));
      }
      // Validate critical environment variables in production
      validateEnv();
      await db.connectDB();

      // Start server
      app.listen(PORT, () => console.log(`Server running on ${BACKEND_URL}`));
    } catch (err) {
      console.error('Startup failed:', err.message || err);
      process.exit(1);
    }
  })();
}

// Graceful shutdown helper
async function cleanup() {
  try {
    // Reset rate limiters
    if (app.resetRateLimit) {
      await app.resetRateLimit();
    }

    // Close any other open resources
    // Add any additional cleanup here
  } catch (err) {
    console.error('Cleanup error:', err);
  }
}

// Handle process termination gracefully
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Cleaning up...');
  await cleanup();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Cleaning up...');
  await cleanup();
  process.exit(0);
});

// Export the app and cleanup for testing
module.exports = app;
