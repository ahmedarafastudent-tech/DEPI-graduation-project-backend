const express = require('express');
const router = express.Router();
const {
  trackEvent,
  getAnalytics,
  getUserActivity,
  getProductAnalytics,
} = require('../controllers/analyticsController');
const { protect, admin } = require('../middleware/authMiddleware');
const optionalAuth = require('../middleware/optionalAuth');

router.post('/event', optionalAuth, trackEvent);
router.get('/', protect, admin, getAnalytics);
router.get('/user/:userId', protect, admin, getUserActivity);
router.get('/products', protect, admin, getProductAnalytics);

module.exports = router;
