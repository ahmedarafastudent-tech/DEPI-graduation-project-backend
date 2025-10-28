const mongoose = require('mongoose');

const analyticsSchema = mongoose.Schema({
  eventType: {
    type: String,
    enum: [
      'sale',
      'view',
      'cart',
      'search',
      'wishlist',
      'product_view',
      'product_purchase',
      'page_view',
      'purchase',
    ],
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  session: String,
  value: Number, 
});

analyticsSchema.index({ eventType: 1, timestamp: -1 });
analyticsSchema.index({ product: 1, eventType: 1 });
analyticsSchema.index({ userId: 1, eventType: 1 });

module.exports = mongoose.model('Analytics', analyticsSchema);
