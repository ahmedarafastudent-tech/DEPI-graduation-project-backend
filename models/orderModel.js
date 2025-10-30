const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    qty: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
  image: { type: String, required: false, default: '' },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative'],
      get: (v) => parseFloat(v.toFixed(2)),
      set: (v) => parseFloat(v.toFixed(2)),
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
  },
  { _id: true },
);

const orderSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    orderItems: [orderItemSchema],
    shippingAddress: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      required: true,
      // accept both lowercase and common capitalized variants used in tests
      enum: ['credit_card', 'paypal', 'PayPal', 'cod', 'bank_transfer', 'paytabs', 'Paytabs'],
    },
    paymentResult: {
      id: String,
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
      },
      update_time: Date,
      email_address: {
        type: String,
        lowercase: true,
        trim: true,
      },
      payment_method: String,
      tran_ref: { type: String, index: true },
      response_status: String,
    },
    itemsPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      get: (v) => parseFloat(v.toFixed(2)),
      set: (v) => parseFloat(v.toFixed(2)),
    },
    taxPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      get: (v) => parseFloat(v.toFixed(2)),
      set: (v) => parseFloat(v.toFixed(2)),
    },
    shippingPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      get: (v) => parseFloat(v.toFixed(2)),
      set: (v) => parseFloat(v.toFixed(2)),
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      get: (v) => parseFloat(v.toFixed(2)),
      set: (v) => parseFloat(v.toFixed(2)),
    },
    isPaid: { type: Boolean, default: false },
    paidAt: Date,
    isDelivered: { type: Boolean, default: false },
    deliveredAt: Date,
  },
  { timestamps: true },
);

module.exports = mongoose.model('Order', orderSchema);
