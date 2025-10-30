const asyncHandler = require('express-async-handler');
const Shipping = require('../models/shippingModel');


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


const getShippingMethods = asyncHandler(async (req, res) => {
  const { region } = req.query;
  
  let query = { isActive: true };
  if (region) {
    query.regions = region;
  }

  const shippingMethods = await Shipping.find(query);
  res.json(shippingMethods);
});


const getShippingMethodById = asyncHandler(async (req, res) => {
  const shipping = await Shipping.findById(req.params.id);

  if (shipping) {
    res.json(shipping);
  } else {
    res.status(404);
    throw new Error('Shipping method not found');
  }
});


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


const calculateShipping = asyncHandler(async (req, res) => {
  const { weight, region, methodId } = req.body;
  if (weight === undefined || weight === null || isNaN(Number(weight))) {
    res.status(400);
    throw new Error('Weight is required and must be a number');
  }

  if (Number(weight) < 0) {
    res.status(400);
    throw new Error('Invalid weight');
  }

  const shippingMethod = await Shipping.findById(methodId);

  if (!shippingMethod || shippingMethod.isActive === false) {
    res.status(404);
    throw new Error('Shipping method not found');
  }

  if (shippingMethod.regions && Array.isArray(shippingMethod.regions) && shippingMethod.regions.length > 0) {
    if (!region || !shippingMethod.regions.includes(region)) {
      res.status(404);
      throw new Error('Shipping method not available for this region');
    }
  }

  const weightNum = Number(weight);
  let cost;
  if (typeof shippingMethod.calculateCost === 'function') {
    cost = shippingMethod.calculateCost(weightNum, region);
  } else {
    const base = typeof shippingMethod.baseRate === 'number' ? shippingMethod.baseRate : (typeof shippingMethod.baseCost === 'number' ? shippingMethod.baseCost : 0);
    const perKg = typeof shippingMethod.ratePerKg === 'number' ? shippingMethod.ratePerKg : 0;
    cost = base + (weightNum * perKg);
  }

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