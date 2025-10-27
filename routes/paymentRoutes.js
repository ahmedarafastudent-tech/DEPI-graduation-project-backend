const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createPayment,
  handleWebhook,
  verifyPaymentPublic,
  refundPayment,
  ipnHandler,
  getConfig,
} = require('../controllers/paymentController');

router.post('/create-payment', protect, createPayment);
router.post('/verify-payment', verifyPaymentPublic);
router.post('/refund', protect, refundPayment);
router.post('/ipn', ipnHandler);
router.post('/webhook', handleWebhook);
router.get('/config', getConfig);

module.exports = router;
