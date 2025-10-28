const express = require('express');
const router = express.Router();
const {
  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  applyCouponToCart
} = require('../controllers/couponController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', protect, admin, createCoupon);

router.get('/', protect, admin, getCoupons);

router.get('/:id', protect, admin, getCouponById);

router.put('/:id', protect, admin, updateCoupon);

router.delete('/:id', protect, admin, deleteCoupon);

router.post('/validate', protect, validateCoupon);

router.post('/:id/apply', protect, applyCouponToCart);

module.exports = router;