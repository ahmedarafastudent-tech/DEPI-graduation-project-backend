const asyncHandler = require('express-async-handler');
const Category = require('../models/categoryModel');
const Product = require('../models/productModel');
const AppError = require('../utils/appError');

const getCategories = asyncHandler(async (req, res) => {
  const { includeCounts, isActive, search } = req.query;
  const query = {};

  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  const categories = await Category.find(query).populate('subcategories');

  if (includeCounts) {
    const result = await Promise.all(
      categories.map(async (cat) => {
        const count = await Product.countDocuments({ category: cat._id });
        const obj = cat.toObject();
        obj.productCount = count;
        return obj;
      })
    );
    return res.json(result);
  }

  res.json(categories);
});

const createCategory = asyncHandler(async (req, res) => {
  const { name, description, image } = req.body;
  if (!name) {
    throw new AppError('name field is required', 400);
  }
  if (name.trim().length < 2) {
    throw new AppError('name length must be at least 2 characters', 400);
  }

  const exists = await Category.findOne({ name: name.trim() });
  if (exists) {
    throw new AppError('Category already exists', 400);
  }

  const category = await Category.create({ name: name.trim(), description, image });
  res.status(201).json(category);
});

const getCategoryById = asyncHandler(async (req, res) => {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new AppError('Invalid ID format', 400);
    }

  const category = await Category.findById(req.params.id).populate('subcategories');
  if (!category) throw new AppError(`Not Found - /api/categories/${req.params.id}`, 404);
  res.json(category);
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError(`Not Found - /api/categories/${req.params.id}`, 404);

  const { name, description, image, isActive } = req.body;
  if (name) {
    const dup = await Category.findOne({ name: name.trim(), _id: { $ne: category._id } });
    if (dup) throw new AppError('Category with that name already exists', 400);
    category.name = name.trim();
    category.slug = name
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
  }
  if (typeof description !== 'undefined') category.description = description;
  if (typeof image !== 'undefined') category.image = image;
  if (typeof isActive !== 'undefined') category.isActive = isActive;

  await category.save();
  res.json(category);
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError(`Not Found - /api/categories/${req.params.id}`, 404);
  await Category.findByIdAndDelete(req.params.id);
  res.json({ message: 'Category removed' });
});

module.exports = {
  getCategories,
  createCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
    updateCategoryStatus: asyncHandler(async (req, res) => {
      const category = await Category.findById(req.params.id);
      if (!category) {
        throw new AppError(`Not Found - /api/categories/${req.params.id}`, 404);
      }
      category.isActive = req.body.isActive;
      await category.save();
      res.json(category);
    }),
};
