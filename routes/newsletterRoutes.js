const express = require('express');
const router = express.Router();
const {
  subscribe,
  unsubscribe,
  updatePreferences,
  getSubscribers,
  sendNewsletter,
} = require('../controllers/newsletterController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/subscribe', subscribe);
router.post('/unsubscribe', unsubscribe);
router.put('/preferences', updatePreferences);
router.get('/subscribers', protect, admin, getSubscribers);
router.post('/send', protect, admin, sendNewsletter);

module.exports = router;
