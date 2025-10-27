const mongoose = require('mongoose');

const cartItemSchema = mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: { type: String, required: true },
  qty: { type: Number, required: true, default: 1 },
  price: { type: Number, required: true },
});

const cartSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
    totalPrice: { type: Number, required: true, default: 0 },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Cart', cartSchema);
