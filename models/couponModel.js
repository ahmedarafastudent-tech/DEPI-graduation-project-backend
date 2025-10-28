const mongoose = require('mongoose');

const couponSchema = mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: false,
      default: 'fixed',
    },
    value: {
      type: Number,
      required: false,
      default: 0,
    },
    validFrom: {
      type: Date,
      required: false,
      default: Date.now,
    },
    validUntil: {
      type: Date,
      required: false,
      default: function () {
        return new Date(Date.now() + 1000 * 60 * 60 * 24 * 365);
      },
    },
    minimumPurchase: {
      type: Number,
      default: 0,
    },
    maxUsage: {
      type: Number,
      required: false,
      default: 10000,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    applicableCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    usageHistory: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        order: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Order',
        },
        usedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

couponSchema.methods.isValid = function () {
  const now = new Date();
  return (
    this.isActive &&
    now >= this.validFrom &&
    now <= this.validUntil &&
    this.usedCount < this.maxUsage
  );
};

couponSchema.methods.calculateDiscount = function (subtotal) {
  if (subtotal < this.minimumPurchase) return 0;

  if (this.discountType === 'percentage') {
    return (subtotal * this.discountAmount) / 100;
  }
  return this.discountAmount;
};

module.exports = mongoose.model('Coupon', couponSchema);
