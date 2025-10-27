const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  createShippingMethod,
  getShippingMethods,
  updateShippingMethod,
  calculateShipping,
} = require('../controllers/shippingController');

// Public routes
router.route('/').get(getShippingMethods);
router.post('/calculate', calculateShipping);

// Protected routes
router.use(protect);
router.use(admin);

router.route('/')
  .post(createShippingMethod);

router.route('/:id')
  .put(updateShippingMethod);

module.exports = router;