const mongoose = require('mongoose');

const shippingMethodSchema = mongoose.Schema({
  // Support fields expected by tests: baseRate, ratePerKg, regions
  name: { type: String, required: true },
  carrier: { type: String, required: false },
  estimatedDays: { type: String },
  baseRate: { type: Number, required: false, default: 0 },
  ratePerKg: { type: Number, required: false, default: 0 },
  regions: [{ type: String }],
  // Backwards-compatible fields
  estimatedDaysRange: {
    min: Number,
    max: Number,
  },
  baseCost: { type: Number, required: false },
  isActive: { type: Boolean, default: true },
  restrictions: {
    maxWeight: Number,
    maxDimensions: {
      length: Number,
      width: Number,
      height: Number,
    },
    restrictedCountries: [String],
  },
  zonePricing: [
    {
      countries: [String],
      additionalCost: Number,
    },
  ],
  weightPricing: [
    {
      minWeight: Number,
      maxWeight: Number,
      additionalCost: Number,
    },
  ],
});

// Calculate shipping cost
// Calculate shipping cost — prefer baseRate/ratePerKg shape used in tests
shippingMethodSchema.methods.calculateCost = function (weight = 0, country) {
  let cost = 0;
  if (typeof this.baseRate === 'number') cost = this.baseRate;
  else if (typeof this.baseCost === 'number') cost = this.baseCost;

  // region/zone additions
  if (this.zonePricing && Array.isArray(this.zonePricing)) {
    const zone = this.zonePricing.find(
      (z) => z.countries && z.countries.includes(country)
    );
    if (zone && typeof zone.additionalCost === 'number')
      cost += zone.additionalCost;
  }

  // weight-based
  if (typeof this.ratePerKg === 'number') {
    cost += weight * this.ratePerKg;
  } else if (this.weightPricing && Array.isArray(this.weightPricing)) {
    const tier = this.weightPricing.find(
      (w) => weight >= w.minWeight && weight <= w.maxWeight
    );
    if (tier && typeof tier.additionalCost === 'number')
      cost += tier.additionalCost;
  }

  return cost;
};

module.exports = mongoose.model('ShippingMethod', shippingMethodSchema);
