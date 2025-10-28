const asyncHandler = require('express-async-handler');
const Coupon = require('../models/couponModel');
const AppError = require('../utils/appError');

const createCoupon = asyncHandler(async (req, res) => {
  if (!req.user.isAdmin) {
    throw new AppError('Not authorized as an admin', 401);
  }

  const {
    code,
    type,
    value,
    minPurchase,
    maxDiscount,
    startDate,
    endDate,
    maxUses,
    description
  } = req.body;

  if (!code || !type || !value) {
    throw new AppError('Please provide code, type and value for the coupon', 400);
  }

  const couponExists = await Coupon.findOne({ code: code.toUpperCase() });
  if (couponExists) {
    throw new AppError('Coupon code already exists', 400);
  }

  if (type !== 'percentage' && type !== 'fixed') {
    throw new AppError('Coupon type must be either percentage or fixed', 400);
  }

  if (type === 'percentage' && (value <= 0 || value > 100)) {
    throw new AppError('Percentage discount must be between 0 and 100', 400);
  }

  if (type === 'fixed' && value <= 0) {
    throw new AppError('Fixed discount value must be greater than 0', 400);
  }

  const now = new Date();
  const start = startDate ? new Date(startDate) : now;
  const end = endDate ? new Date(endDate) : null;

  if (end && end <= start) {
    throw new AppError('End date must be after start date', 400);
  }

  if (minPurchase && minPurchase < 0) {
    throw new AppError('Minimum purchase amount cannot be negative', 400);
  }

  if (maxDiscount && maxDiscount < 0) {
    throw new AppError('Maximum discount amount cannot be negative', 400);
  }

  const coupon = await Coupon.create({
    code: code.toUpperCase(),
    type,
    value,
    minimumPurchase: minPurchase || 0,
    maxDiscount: maxDiscount,
    validFrom: start,
    validUntil: end,
    maxUsage: maxUses,
    description,
    usedCount: 0,
    isActive: true
  });

  res.status(201).json(coupon);
});


const getCoupons = asyncHandler(async (req, res) => {
  if (!req.user.isAdmin) {
    throw new AppError('Not authorized as an admin', 401);
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.isActive) {
    filter.isActive = req.query.isActive === 'true';
  }

  const coupons = await Coupon.find(filter)
    .limit(limit)
    .skip(skip)
    .sort({ createdAt: -1 });

  const total = await Coupon.countDocuments(filter);

  res.json(coupons);
});


const getCouponById = asyncHandler(async (req, res) => {
  if (!req.user.isAdmin) {
    throw new AppError('Not authorized as an admin', 401);
  }

  if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    throw new AppError('Invalid coupon ID', 400);
  }

  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    throw new AppError('Coupon not found', 404);
  }

  res.json(coupon);
});


const updateCoupon = asyncHandler(async (req, res) => {
  if (!req.user.isAdmin) {
    throw new AppError('Not authorized as an admin', 401);
  }

  if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    throw new AppError('Invalid coupon ID', 400);
  }

  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    throw new AppError('Coupon not found', 404);
  }

  if (req.body.code && req.body.code.toUpperCase() !== coupon.code) {
    const existingCoupon = await Coupon.findOne({ code: req.body.code.toUpperCase() });
    if (existingCoupon) {
      throw new AppError('Coupon code already exists', 400);
    }
  }

  if (req.body.type && !['percentage', 'fixed'].includes(req.body.type)) {
    throw new AppError('Coupon type must be either percentage or fixed', 400);
  }

  if (req.body.value) {
    if (req.body.type === 'percentage' && (req.body.value <= 0 || req.body.value > 100)) {
      throw new AppError('Percentage discount must be between 0 and 100', 400);
    }
    if ((req.body.type || coupon.type) === 'fixed' && req.body.value <= 0) {
      throw new AppError('Fixed discount value must be greater than 0', 400);
    }
  }

  coupon.code = req.body.code?.toUpperCase() || coupon.code;
  coupon.type = req.body.type || coupon.type;
  coupon.value = req.body.value || coupon.value;
  coupon.minPurchase = req.body.minPurchase || coupon.minPurchase;
  coupon.maxDiscount = req.body.maxDiscount || coupon.maxDiscount;
  coupon.startDate = req.body.startDate || coupon.startDate;
  coupon.endDate = req.body.endDate || coupon.endDate;
  coupon.maxUses = req.body.maxUses || coupon.maxUses;
  coupon.description = req.body.description || coupon.description;
  coupon.isActive = req.body.isActive !== undefined ? req.body.isActive : coupon.isActive;

  if (req.body.startDate || req.body.endDate) {
    const start = new Date(coupon.startDate);
    const end = coupon.endDate ? new Date(coupon.endDate) : null;
    
    if (end && end <= start) {
      throw new AppError('End date must be after start date', 400);
    }
  }

  const updatedCoupon = await coupon.save();
  res.json(updatedCoupon);
});


const deleteCoupon = asyncHandler(async (req, res) => {
  if (!req.user.isAdmin) {
    throw new AppError('Not authorized as an admin', 401);
  }

  if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    throw new AppError('Invalid coupon ID', 400);
  }

  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    throw new AppError('Coupon not found', 404);
  }

  await coupon.deleteOne();
  res.json({ 
    message: 'Coupon removed successfully',
    coupon: coupon
  });
});

const validateCoupon = asyncHandler(async (req, res) => {
  const { code, cartTotal } = req.body;

  if (!code || !cartTotal) {
    throw new AppError('Please provide coupon code and cart total', 400);
  }

  if (cartTotal <= 0) {
    throw new AppError('Cart total must be greater than 0', 400);
  }

  const coupon = await Coupon.findOne({ 
    code: code.toUpperCase() 
  });

  if (!coupon) {
    throw new AppError('Invalid or expired coupon', 404);
  }

  if (coupon.minPurchase && cartTotal < coupon.minPurchase) {
    throw new AppError(`Minimum purchase amount of ${coupon.minPurchase} required`, 400);
  }

  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    throw new AppError('Coupon has reached maximum usage limit', 400);
  }

  if (typeof coupon.minimumPurchase === 'number' && cartTotal < coupon.minimumPurchase) {
    throw new AppError(`Minimum purchase amount of ${coupon.minimumPurchase} required`, 400);
  }

  let calculatedDiscount = 0;
  if (coupon.type === 'percentage') {
    calculatedDiscount = (cartTotal * coupon.value) / 100;
  } else {
    calculatedDiscount = coupon.value;
  }

  if (coupon.maxDiscount && calculatedDiscount > coupon.maxDiscount) {
    calculatedDiscount = coupon.maxDiscount;
  }

  if (calculatedDiscount > cartTotal) {
    calculatedDiscount = cartTotal;
  }

  res.json({
    valid: true,
    coupon: {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discountAmount: calculatedDiscount,
      finalTotal: cartTotal - calculatedDiscount
    }
  });

});


const applyCouponToCart = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  const { cartTotal } = req.body;

  if (!coupon) {
    throw new AppError('Coupon not found', 404);
  }

  if (!coupon.isActive) {
    throw new AppError('Coupon is not active', 400);
  }

  const now = new Date();
  if (coupon.startDate > now) {
    throw new AppError('Coupon is not yet valid', 400);
  }

  if (coupon.endDate && coupon.endDate < now) {
    throw new AppError('Coupon has expired', 400);
  }

  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    throw new AppError('Coupon has reached maximum usage limit', 400);
  }

  if (coupon.minPurchase && cartTotal < coupon.minPurchase) {
    throw new AppError(`Minimum purchase amount of $${coupon.minPurchase} required`, 400);
  }

  let calculatedDiscount = coupon.type === 'percentage' 
    ? (cartTotal * coupon.value) / 100 
    : coupon.value;

  if (coupon.maxDiscount) {
    calculatedDiscount = Math.min(calculatedDiscount, coupon.maxDiscount);
  }

  if (calculatedDiscount > cartTotal) {
    calculatedDiscount = cartTotal;
  }

  coupon.usedCount += 1;
  await coupon.save();

  res.json({
    success: true,
    coupon: {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discountAmount: calculatedDiscount,
      finalTotal: cartTotal - calculatedDiscount
    }
  });
});

module.exports = {
  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  applyCouponToCart
};