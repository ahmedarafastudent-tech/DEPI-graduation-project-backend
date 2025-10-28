const asyncHandler = require('express-async-handler');
const Tax = require('../models/taxModel');

const createTaxRate = asyncHandler(async (req, res) => {
  const {
    name,
    rate,
    region,
    type,
    isDefault,
    exemptCategories,
    threshold
  } = req.body;

  if (isDefault) {
    await Tax.updateMany(
      { region, isDefault: true },
      { isDefault: false }
    );
  }

  const tax = await Tax.create({
    name,
    rate,
    region,
    type,
    isDefault,
    exemptCategories,
    threshold,
    isActive: true
  });

  res.status(201).json(tax);
});

const getTaxRates = asyncHandler(async (req, res) => {
  const { region } = req.query;
  
  let query = { isActive: true };
  if (region) {
    query.region = region;
  }

  const taxRates = await Tax.find(query);
  res.json(taxRates);
});

const getTaxRateById = asyncHandler(async (req, res) => {
  const tax = await Tax.findById(req.params.id);

  if (tax) {
    res.json(tax);
  } else {
    res.status(404);
    throw new Error('Tax rate not found');
  }
});


const updateTaxRate = asyncHandler(async (req, res) => {
  const tax = await Tax.findById(req.params.id);

  if (tax) {
    if (req.body.isDefault && !tax.isDefault) {
      await Tax.updateMany(
        { region: tax.region, isDefault: true },
        { isDefault: false }
      );
    }

    tax.name = req.body.name || tax.name;
    tax.rate = req.body.rate !== undefined ? req.body.rate : tax.rate;
    tax.region = req.body.region || tax.region;
    tax.type = req.body.type || tax.type;
    tax.isDefault = req.body.isDefault !== undefined ? req.body.isDefault : tax.isDefault;
    tax.exemptCategories = req.body.exemptCategories || tax.exemptCategories;
    tax.threshold = req.body.threshold !== undefined ? req.body.threshold : tax.threshold;
    tax.isActive = req.body.isActive !== undefined ? req.body.isActive : tax.isActive;

    const updatedTax = await tax.save();
    res.json(updatedTax);
  } else {
    res.status(404);
    throw new Error('Tax rate not found');
  }
});


const deleteTaxRate = asyncHandler(async (req, res) => {
  const tax = await Tax.findById(req.params.id);

  if (tax) {
    await tax.remove();
    res.json({ message: 'Tax rate removed' });
  } else {
    res.status(404);
    throw new Error('Tax rate not found');
  }
});


const calculateTax = asyncHandler(async (req, res) => {
  const { region, items, subtotal } = req.body;

  const taxRate = await Tax.findOne({
    region,
    isActive: true,
    isDefault: true
  });

  if (!taxRate) {
    res.status(404);
    throw new Error('No tax rate found for this region');
  }

  let taxableAmount = subtotal;
  let taxAmount = 0;

  if (taxRate.threshold && subtotal < taxRate.threshold) {
    taxAmount = 0;
  } else {
    if (taxRate.type === 'percentage') {
      taxAmount = (taxableAmount * taxRate.rate) / 100;
    } else {
      taxAmount = taxRate.rate; 
    }
  }

  res.json({
    taxRate: taxRate.rate,
    taxableAmount,
    taxAmount,
    total: subtotal + taxAmount
  });
});

module.exports = {
  createTaxRate,
  getTaxRates,
  getTaxRateById,
  updateTaxRate,
  deleteTaxRate,
  calculateTax
};