const mongoose = require('mongoose');

const taxSchema = mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true,
    index: true 
  },
  region: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  state: {
    type: String,
    trim: true,
    index: true
  },
  rate: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    get: v => parseFloat(v.toFixed(2)),
    set: v => parseFloat(v.toFixed(2))
  },
  type: {
    type: String,
    enum: ['vat', 'sales', 'gst', 'percentage', 'flat'],
    required: true,
    default: 'percentage',
    index: true
  },
  isDefault: { type: Boolean, default: false },
  exemptCategories: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
  ],
  threshold: {
    type: Number,
    required: false,
  },
  productCategories: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
  exemptionRules: [
    {
      condition: {
        type: String,
        enum: ['minimum_amount', 'customer_type', 'product_type'],
      },
      value: mongoose.Schema.Types.Mixed,
      rate: Number,
    },
  ],
  effectiveFrom: {
    type: Date,
    default: Date.now,
  },
  effectiveUntil: Date,
});

taxSchema.methods.calculateTax = function (
  amount,
  customerType,
  productCategory
) {
  if (!this.isActive) return 0;

  const now = new Date();
  if (this.effectiveUntil && now > this.effectiveUntil) return 0;
  if (now < this.effectiveFrom) return 0;

  for (const rule of this.exemptionRules) {
    switch (rule.condition) {
      case 'minimum_amount':
        if (amount >= rule.value) return (amount * rule.rate) / 100;
        break;
      case 'customer_type':
        if (customerType === rule.value) return (amount * rule.rate) / 100;
        break;
      case 'product_type':
        if (productCategory.equals(rule.value))
          return (amount * rule.rate) / 100;
        break;
    }
  }

  return (amount * this.rate) / 100;
};

taxSchema.index({ region: 1, state: 1, type: 1 });

module.exports = mongoose.model('Tax', taxSchema);
