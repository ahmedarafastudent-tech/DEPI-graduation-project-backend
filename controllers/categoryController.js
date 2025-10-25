const asyncHandler = require('express-async-handler');
const Category = require('../models/categoryModel');

// Get all categories
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({}).populate('subcategories');
  res.json(categories);
});

// Create new category
const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const category = await Category.create({ name, description });
  res.status(201).json(category);
});

module.exports = { getCategories, createCategory };