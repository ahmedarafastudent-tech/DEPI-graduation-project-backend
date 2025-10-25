const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/authMiddleware");
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  getProductsBySubcategory
} = require("../controllers/productController");

// Get all products and create new product
router.route("/")
  .get(getProducts)
  .post(protect, admin, createProduct);

// Get products by subcategory
router.route("/subcategory/:subcategoryId")
  .get(getProductsBySubcategory);

// Get, update and delete product by ID
router.route("/:id")
  .get(getProductById)
  .put(protect, admin, updateProduct);

module.exports = router;
