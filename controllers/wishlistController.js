const asyncHandler = require('express-async-handler');
const Wishlist = require('../models/wishlistModel');

// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private
const getWishlist = asyncHandler(async (req, res) => {
  let wishlist = await Wishlist.findOne({ user: req.user._id }).populate('items.product');
  
  if (!wishlist) {
    wishlist = await Wishlist.create({
      user: req.user._id,
      items: []
    });
  }

  res.json(wishlist);
});

// @desc    Add item to wishlist
// @route   POST /api/wishlist
// @access  Private
const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  console.log('Controller - Looking for product ID:', productId);

  // Verify product exists first
  const Product = require('../models/productModel');
  const product = await Product.findById(productId);
  if (!product) {
    console.log('Controller - Product not found in DB');
    res.status(404);
    throw new Error('Product not found');
  }
  console.log('Controller - Found product:', product._id.toString());

  // Find or create wishlist with population
  let wishlist = await Wishlist.findOne({ user: req.user._id }).populate('items.product');
  
  if (!wishlist) {
    wishlist = await Wishlist.create({
      user: req.user._id,
      items: [{ product: productId }]
    });
    wishlist = await wishlist.populate('items.product');
  } else {
    const exists = wishlist.items.some(
      item => item.product && item.product._id.toString() === productId
    );

    if (!exists) {
      wishlist.items.push({ product: productId });
      await wishlist.save();
      wishlist = await wishlist.populate('items.product');
    }
  }

  res.json(wishlist);
});

// @desc    Remove item from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
const removeFromWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id });

  if (!wishlist) {
    res.status(404);
    throw new Error('Wishlist not found');
  }

  wishlist.items = wishlist.items.filter(
    item => item.product.toString() !== req.params.productId
  );

  await wishlist.save();

  res.json(wishlist);
});

// @desc    Clear wishlist
// @route   DELETE /api/wishlist
// @access  Private
const clearWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id });

  if (!wishlist) {
    res.status(404);
    throw new Error('Wishlist not found');
  }

  wishlist.items = [];
  await wishlist.save();

  res.json({ message: 'Wishlist cleared' });
});

// @desc    Move wishlist item to cart
// @route   POST /api/wishlist/:productId/move-to-cart
// @access  Private
const moveToCart = asyncHandler(async (req, res) => {
  const Cart = require('../models/cartModel');
  const Product = require('../models/productModel');

  // Add to cart
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({
      user: req.user._id,
      items: [],
      totalPrice: 0
    });
  }

  // Verify product exists
  const product = await Product.findById(req.params.productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const cartItem = cart.items.find(
    item => item.product && item.product.toString() === req.params.productId
  );

  if (cartItem) {
    cartItem.qty += 1;
  } else {
    cart.items.push({
      product: product._id,
      name: product.name,
      qty: 1,
      price: product.price
    });
  }

  cart.totalPrice = cart.items.reduce((total, item) => total + item.price * item.qty, 0);
  await cart.save();

  // Remove from wishlist
  const wishlist = await Wishlist.findOne({ user: req.user._id });
  if (wishlist) {
    wishlist.items = wishlist.items.filter(
      item => item.product.toString() !== req.params.productId
    );
    await wishlist.save();
  }

  res.json({
    message: 'Item moved to cart',
    cart,
    wishlist
  });
});

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  moveToCart
};