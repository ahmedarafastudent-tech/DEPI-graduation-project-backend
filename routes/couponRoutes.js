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

// @route   POST /api/coupons
// @access  Private/Admin
router.post('/', protect, admin, createCoupon);

// @route   GET /api/coupons
// @access  Private/Admin
router.get('/', protect, admin, getCoupons);

// @route   GET /api/coupons/:id
// @access  Private/Admin
router.get('/:id', protect, admin, getCouponById);

// @route   PUT /api/coupons/:id
// @access  Private/Admin
router.put('/:id', protect, admin, updateCoupon);

// @route   DELETE /api/coupons/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, deleteCoupon);

// @route   POST /api/coupons/validate
// @access  Private
router.post('/validate', protect, validateCoupon);

// @route   POST /api/coupons/:id/apply
// @access  Private
router.post('/:id/apply', protect, applyCouponToCart);

module.exports = router;