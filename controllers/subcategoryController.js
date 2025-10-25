const asyncHandler = require('express-async-handler');
const Subcategory = require('../models/subcategoryModel');
const Category = require('../models/categoryModel');

// Get all subcategories
const getSubcategories = asyncHandler(async (req, res) => {
  const subcategories = await Subcategory.find({}).populate('category');
  res.json(subcategories);
});

// Create new subcategory
const createSubcategory = asyncHandler(async (req, res) => {
  const { name, description, categoryId } = req.body;

  const category = await Category.findById(categoryId);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  const subcategory = await Subcategory.create({
    name,
    description,
    category: categoryId
  });

  // Add subcategory to category
  category.subcategories.push(subcategory._id);
  await category.save();

  res.status(201).json(subcategory);
});

module.exports = { getSubcategories, createSubcategory };