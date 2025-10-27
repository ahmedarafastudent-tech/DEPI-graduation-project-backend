const asyncHandler = require('express-async-handler');
const Shipping = require('../models/shippingModel');

// @desc    Create shipping method
// @route   POST /api/shipping
// @access  Private/Admin
const createShippingMethod = asyncHandler(async (req, res) => {
  const {
    name,
    carrier,
    baseRate,
    ratePerKg,
    estimatedDays,
    restrictions,
    regions
  } = req.body;

  const shipping = await Shipping.create({
    name,
    carrier,
    baseRate,
    ratePerKg,
    estimatedDays,
    restrictions,
    regions,
    isActive: true
  });

  res.status(201).json(shipping);
});

// @desc    Get all shipping methods
// @route   GET /api/shipping
// @access  Public
const getShippingMethods = asyncHandler(async (req, res) => {
  const { region } = req.query;
  
  let query = { isActive: true };
  if (region) {
    query.regions = region;
  }

  const shippingMethods = await Shipping.find(query);
  res.json(shippingMethods);
});

// @desc    Get shipping method by ID
// @route   GET /api/shipping/:id
// @access  Private/Admin
const getShippingMethodById = asyncHandler(async (req, res) => {
  const shipping = await Shipping.findById(req.params.id);

  if (shipping) {
    res.json(shipping);
  } else {
    res.status(404);
    throw new Error('Shipping method not found');
  }
});

// @desc    Update shipping method
// @route   PUT /api/shipping/:id
// @access  Private/Admin
const updateShippingMethod = asyncHandler(async (req, res) => {
  const shipping = await Shipping.findById(req.params.id);

  if (shipping) {
    shipping.name = req.body.name || shipping.name;
    shipping.carrier = req.body.carrier || shipping.carrier;
    shipping.baseRate = req.body.baseRate || shipping.baseRate;
    shipping.ratePerKg = req.body.ratePerKg || shipping.ratePerKg;
    shipping.estimatedDays = req.body.estimatedDays || shipping.estimatedDays;
    shipping.restrictions = req.body.restrictions || shipping.restrictions;
    shipping.regions = req.body.regions || shipping.regions;
    shipping.isActive = req.body.isActive !== undefined ? req.body.isActive : shipping.isActive;

    const updatedShipping = await shipping.save();
    res.json(updatedShipping);
  } else {
    res.status(404);
    throw new Error('Shipping method not found');
  }
});

// @desc    Delete shipping method
// @route   DELETE /api/shipping/:id
// @access  Private/Admin
const deleteShippingMethod = asyncHandler(async (req, res) => {
  const shipping = await Shipping.findById(req.params.id);

  if (shipping) {
    await shipping.remove();
    res.json({ message: 'Shipping method removed' });
  } else {
    res.status(404);
    throw new Error('Shipping method not found');
  }
});

// @desc    Calculate shipping cost
// @route   POST /api/shipping/calculate
// @access  Public
const calculateShipping = asyncHandler(async (req, res) => {
  const { weight, region, methodId } = req.body;

  const shippingMethod = await Shipping.findOne({
    _id: methodId,
    isActive: true,
    regions: region
  });

  if (!shippingMethod) {
    res.status(404);
    throw new Error('Shipping method not available for this region');
  }

  if (weight < 0) {
    res.status(400);
    throw new Error('Invalid weight');
  }

  const cost = shippingMethod.baseRate + (weight * shippingMethod.ratePerKg);

  res.json({
    cost,
    estimatedDays: shippingMethod.estimatedDays,
    method: shippingMethod
  });
});

module.exports = {
  createShippingMethod,
  getShippingMethods,
  getShippingMethodById,
  updateShippingMethod,
  deleteShippingMethod,
  calculateShipping
};