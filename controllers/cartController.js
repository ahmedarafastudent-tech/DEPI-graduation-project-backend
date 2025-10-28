const asyncHandler = require('express-async-handler');
const Cart = require('../models/cartModel');
const Product = require('../models/productModel');

const recalcTotal = (items) =>
  items.reduce((sum, it) => sum + it.price * it.qty, 0);

const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate(
    'items.product',
    'name price'
  );
  if (!cart) return res.json({ items: [], totalPrice: 0 });
  res.json(cart);
});


const addItem = asyncHandler(async (req, res) => {
  const { product: productId, qty } = req.body;
  if (!productId || !qty) {
    res.status(400);
    throw new Error('Product id and qty are required');
  }

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [], totalPrice: 0 });
  }

  const existingIndex = cart.items.findIndex(
    (i) => i.product.toString() === productId
  );
  if (existingIndex > -1) {
    cart.items[existingIndex].qty = qty;
    cart.items[existingIndex].price = product.price;
  } else {
    cart.items.push({
      product: product._id,
      name: product.name,
      qty,
      price: product.price,
    });
  }

  cart.totalPrice = recalcTotal(cart.items);
  cart.totalPrice = Number(cart.totalPrice.toFixed(2));
  await cart.save();

  res.status(200).json(cart);
});

const updateItemQty = asyncHandler(async (req, res) => {
  const { qty } = req.body;
  const { productId } = req.params;
  if (qty == null) {
    res.status(400);
    throw new Error('qty is required');
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }

  const idx = cart.items.findIndex((i) => i.product.toString() === productId);
  if (idx === -1) {
    res.status(404);
    throw new Error('Item not found in cart');
  }

  cart.items[idx].qty = qty;
  cart.totalPrice = recalcTotal(cart.items);
  await cart.save();

  res.json(cart);
});


const removeItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }

  cart.items = cart.items.filter((i) => i.product.toString() !== productId);
  cart.totalPrice = recalcTotal(cart.items);
  await cart.save();

  res.json(cart);
});


const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.status(200).json({ message: 'Cart cleared' });
  cart.items = [];
  cart.totalPrice = 0;
  await cart.save();
  res.json({ message: 'Cart cleared' });
});

module.exports = { getCart, addItem, updateItemQty, removeItem, clearCart };
