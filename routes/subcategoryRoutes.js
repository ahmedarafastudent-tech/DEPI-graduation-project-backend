const express = require('express');
const router = express.Router();
const {
  getSubcategories,
  getSubcategoryById,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
} = require('../controllers/subcategoryController');
const { protect, admin } = require('../middleware/authMiddleware');

router
  .route('/')
  .get(getSubcategories)
  .post(protect, admin, createSubcategory);

router
  .route('/:id')
  .get(getSubcategoryById)
  .put(protect, admin, updateSubcategory)
  .delete(protect, admin, deleteSubcategory);

module.exports = router;
