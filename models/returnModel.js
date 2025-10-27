const mongoose = require('mongoose');

const returnSchema = mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
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
        condition: {
          type: String,
          enum: ['unopened', 'like-new', 'used', 'damaged'],
          required: false,
          default: 'used',
        },
        images: [String],
      },
    ],
    status: {
      type: String,
      enum: [
        'pending',
        'approved',
        'rejected',
        'shipped',
        'received',
        'completed',
      ],
      default: 'pending',
    },
    returnShipping: {
      trackingNumber: String,
      carrier: String,
      shippingLabel: String,
      shippedAt: Date,
      receivedAt: Date,
    },
    refundAmount: Number,
    refundStatus: {
      type: String,
      enum: ['pending', 'processed', 'completed', 'failed'],
      default: 'pending',
    },
    refundDetails: {
      method: String,
      transactionId: String,
      processedAt: Date,
    },
    notes: [
      {
        content: String,
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    resolutionDetails: {
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      resolvedAt: Date,
      resolution: String,
    },
    // Admin notes field (used when admin updates status)
    adminNotes: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Return', returnSchema);
