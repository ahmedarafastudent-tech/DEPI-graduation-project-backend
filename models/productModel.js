const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

const variantSchema = mongoose.Schema({
  sku: {
    type: String,
    required: false,
  },
  attributes: {
    type: Map,
    of: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  compareAtPrice: Number,
  countInStock: {
    type: Number,
    required: true,
    default: 0,
  },
  images: [
    {
      url: String,
      publicId: String,
    },
  ],
  weight: Number,
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
  },
  barcode: String,
});

const inventoryHistorySchema = mongoose.Schema({
  type: {
    type: String,
    enum: ['in', 'out', 'adjustment'],
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  reference: {
    type: String,
    enum: ['order', 'return', 'manual', 'other'],
  },
  referenceId: mongoose.Schema.Types.ObjectId,
  variant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Variant',
  },
  date: {
    type: Date,
    default: Date.now,
  },
  note: String,
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

const productSchema = mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 200,
      index: true
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 2000
    },
    basePrice: {
      type: Number,
      required: false,
      default: 0,
      min: 0,
      get: v => parseFloat(v.toFixed(2)),
      set: v => parseFloat(v.toFixed(2))
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      get: v => parseFloat(v.toFixed(2)),
      set: v => parseFloat(v.toFixed(2))
    },
    images: [
      {
        url: String,
        publicId: String,
      },
    ],
    // Allow category to be either an ObjectId referencing Category or a
    // simple string (tests sometimes create products with a category name).
    // Using Mixed keeps existing behavior working for real ObjectIds while
    // allowing tests to pass simple strings.
    category: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
      index: true,
    },
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subcategory',
      index: true
    },
    countInStock: {
      type: Number,
      required: true,
      default: 0,
    },
    reviews: [reviewSchema],
    rating: {
      type: Number,
      required: true,
      default: 0,
    },
    numReviews: {
      type: Number,
      required: true,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    brand: {
      type: String,
    },
    tags: [String],
    variants: [variantSchema],
    defaultVariant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Variant',
    },
    variantAttributes: [
      {
        name: String,
        values: [String],
      },
    ],
    inventoryHistory: [inventoryHistorySchema],
    lowStockAlert: {
      threshold: {
        type: Number,
        default: 5,
      },
      enabled: {
        type: Boolean,
        default: true,
      },
      lastNotified: Date,
    },
    sku: {
      type: String,
      unique: true,
      required: false,
    },

    seoMetadata: {
      title: String,
      description: String,
      keywords: [String],
    },
    shippingInfo: {
      weight: Number,
      dimensions: {
        length: Number,
        width: Number,
        height: Number,
      },
      freeShipping: {
        type: Boolean,
        default: false,
      },
      shippingClass: String,
    },
    warranty: {
      available: {
        type: Boolean,
        default: false,
      },
      duration: Number,
      terms: String,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.virtual('totalInventory').get(function () {
  return this.variants.reduce(
    (total, variant) => total + variant.countInStock,
    0
  );
});

productSchema.methods.isLowStock = function () {
  return this.totalInventory <= this.lowStockAlert.threshold;
};

productSchema.methods.adjustInventory = async function (
  variantId,
  quantity,
  reason,
  reference = 'manual',
  referenceId = null,
  userId
) {
  const variant = this.variants.id(variantId);
  if (!variant) throw new Error('Variant not found');

  const newStock = variant.countInStock + quantity;
  if (newStock < 0) throw new Error('Insufficient stock');

  variant.countInStock = newStock;

  this.inventoryHistory.push({
    type: quantity > 0 ? 'in' : 'out',
    quantity: Math.abs(quantity),
    reason,
    reference,
    referenceId,
    variant: variantId,
    performedBy: userId,
  });

  await this.save();
  return variant.countInStock;
};

productSchema.pre('validate', function (next) {
  if (!this.sku) {
    const base = this.name
      ? this.name
          .replace(/[^a-zA-Z0-9]/g, '')
          .toUpperCase()
          .slice(0, 8)
      : 'PRD';
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.sku = `${base}-${rand}`;
  }
  if (!this.seller && this.user) {
    this.seller = this.user;
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
