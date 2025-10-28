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

router.get('/search', searchProducts);
router.get('/top', getTopProducts);
router.get('/featured', getFeaturedProducts);
router.get('/brand/:brand', getProductsByBrand);

router.route('/')
  .get(getProducts)
  .post(protect, admin, createProduct);

router.route('/:id/reviews')
  .post(protect, createProductReview);

router.route('/subcategory/:subcategoryId')
  .get(getProductsBySubcategory);

router.route('/:id')
  .get(getProductById)
  .put(protect, admin, updateProduct);

module.exports = router;
