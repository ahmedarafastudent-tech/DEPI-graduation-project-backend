const express = require('express');
const router = express.Router();
const { getSubcategories, createSubcategory } = require('../controllers/subcategoryController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(getSubcategories)
  .post(protect, admin, createSubcategory);

module.exports = router;