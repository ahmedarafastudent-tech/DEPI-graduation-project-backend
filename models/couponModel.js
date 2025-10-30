const mongoose = require('mongoose');

const couponSchema = mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
      index: true
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
      default: 'fixed',
      index: true
    },
    value: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: function(v) {
          if (this.type === 'percentage') {
            return v <= 100;
          }
          return true;
        },
        message: props => `${props.value}% is not a valid percentage discount!`
      }
    },
    validFrom: {
      type: Date,
      required: true,
      default: Date.now,
      index: true
    },
    validUntil: {
      type: Date,
      required: true,
      default: function () {
        return new Date(Date.now() + 1000 * 60 * 60 * 24 * 365);
      },
      index: true
    },
    minimumPurchase: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    maxUsage: {
      type: Number,
      required: true,
      default: 10000,
      min: 1
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
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
  const min = this.minimumPurchase || 0;
  if (subtotal < min) return 0;

  if (this.type === 'percentage') {
    return (subtotal * (this.value || 0)) / 100;
  }
  return this.value || 0;
};

module.exports = mongoose.model('Coupon', couponSchema);
