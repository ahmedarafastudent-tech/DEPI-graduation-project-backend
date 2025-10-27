const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
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
} = require('../controllers/productController');

// Search and filter routes
router.get('/search', searchProducts);
router.get('/top', getTopProducts);
router.get('/featured', getFeaturedProducts);
router.get('/brand/:brand', getProductsByBrand);

// Main product routes
router.route('/')
  .get(getProducts)
  .post(protect, admin, createProduct);

// Review routes
router.route('/:id/reviews')
  .post(protect, createProductReview);

// Subcategory route
router.route('/subcategory/:subcategoryId')
  .get(getProductsBySubcategory);

// Individual product routes
router.route('/:id')
  .get(getProductById)
  .put(protect, admin, updateProduct);

module.exports = router;
