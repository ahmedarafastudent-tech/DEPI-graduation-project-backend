const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Product = require('../models/productModel');

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = {};
  if (req.query.category) {
    try {
      query.category = mongoose.Types.ObjectId(req.query.category);
    } catch (err) {
      // fallback to raw value if it isn't a valid ObjectId
      query.category = req.query.category;
    }
  }
  if (req.query.search) {
    query.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  let mongoQuery = Product.find(query)
    .populate('category', 'name')
    .populate('subcategory', 'name')
    .skip(skip)
    .limit(limit);

  if (req.query.sort) {
    mongoQuery = mongoQuery.sort(req.query.sort.replace(',', ' '));
  }

  const [products, total] = await Promise.all([
    mongoQuery.exec(),
    Product.countDocuments(query),
  ]);

  res.json({ products, page, pages: Math.ceil(total / limit), total });
});

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('category', 'name')
    .populate('subcategory', 'name');

  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, category, subcategory, countInStock } =
    req.body;

  const product = await Product.create({
    name,
    description,
    price,
    category,
    subcategory,
    countInStock,
    seller: req.user._id,
  });

  if (product) {
    const populatedProduct = await Product.findById(product._id)
      .populate('category', 'name')
      .populate('subcategory', 'name');
    res.status(201).json(populatedProduct);
  } else {
    res.status(400);
    throw new Error('Invalid product data');
  }
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  const { name, description, price, category, subcategory, countInStock } =
    req.body;

  const product = await Product.findById(req.params.id);

  if (product) {
    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.category = category || product.category;
    product.subcategory = subcategory || product.subcategory;
    product.countInStock = countInStock || product.countInStock;

    const updatedProduct = await product.save();
    const populatedProduct = await Product.findById(updatedProduct._id)
      .populate('category', 'name')
      .populate('subcategory', 'name');

    res.json(populatedProduct);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Get products by subcategory
// @route   GET /api/products/subcategory/:subcategoryId
// @access  Public
const getProductsBySubcategory = asyncHandler(async (req, res) => {
  const products = await Product.find({ subcategory: req.params.subcategoryId })
    .populate('category', 'name')
    .populate('subcategory', 'name');
  res.json(products);
});

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  const product = await Product.findById(req.params.id);

  if (product) {
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      res.status(400);
      throw new Error('Product already reviewed');
    }

    const review = {
      name: req.user.name,
      rating: Number(rating),
      comment,
      user: req.user._id,
    };

    product.reviews.push(review);

    product.numReviews = product.reviews.length;

    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();
    res.status(201).json({ message: 'Review added' });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Get top rated products
// @route   GET /api/products/top
// @access  Public
const getTopProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({}).sort({ rating: -1 }).limit(5);

  res.json(products);
});

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isFeatured: true })
    .populate('category', 'name')
    .populate('subcategory', 'name')
    .limit(10);

  res.json(products);
});

// @desc    Get products by brand
// @route   GET /api/products/brand/:brand
// @access  Public
const getProductsByBrand = asyncHandler(async (req, res) => {
  const products = await Product.find({ brand: req.params.brand })
    .populate('category', 'name')
    .populate('subcategory', 'name');

  res.json(products);
});

// @desc    Search products
// @route   GET /api/products/search
// @access  Public
const searchProducts = asyncHandler(async (req, res) => {
  const { q, category, minPrice, maxPrice, sort } = req.query;

  const query = {};

  if (q) {
    query.$or = [
      { name: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { brand: { $regex: q, $options: 'i' } },
      { tags: { $in: [new RegExp(q, 'i')] } },
    ];
  }

  if (category) query.category = category;
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  let products = await Product.find(query)
    .populate('category', 'name')
    .populate('subcategory', 'name');

  if (sort) {
    const sortFields = sort.split(',').join(' ');
    products = await Product.find(query).sort(sortFields);
  }

  res.json(products);
});

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  getProductsBySubcategory,
  createProductReview,
  getTopProducts,
  getFeaturedProducts,
  getProductsByBrand,
  searchProducts,
};
