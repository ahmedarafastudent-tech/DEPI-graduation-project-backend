const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  createShippingMethod,
  getShippingMethods,
  updateShippingMethod,
  calculateShipping,
} = require('../controllers/shippingController');

router.route('/').get(getShippingMethods);
router.post('/calculate', calculateShipping);

router.use(protect);
router.use(admin);

router.route('/')
  .post(createShippingMethod);

router.route('/:id')
  .put(updateShippingMethod);

module.exports = router;