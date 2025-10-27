const asyncHandler = require('express-async-handler');
const Subcategory = require('../models/subcategoryModel');
const Category = require('../models/categoryModel');

const getSubcategories = asyncHandler(async (req, res) => {
  const mongoose = require('mongoose');
  const filter = { isActive: true };
  
  // Handle category filtering with proper ObjectId casting
  if (req.query.category) {
    try {
      filter.category = new mongoose.Types.ObjectId(req.query.category);
    } catch (e) {
      filter.category = req.query.category;
    }
  }

  // First get all active subcategories
  const rawSubcategories = await Subcategory.find(filter).lean();

  // Transform results to always have a category object with _id
  const subcategories = rawSubcategories.map(sub => {
    let categoryObject;
    if (sub.category) {
      // Handle ObjectId specifically
      if (sub.category instanceof mongoose.Types.ObjectId) {
        categoryObject = { _id: sub.category };
      }
      // Handle plain object with _id
      else if (typeof sub.category === 'object' && sub.category._id) {
        categoryObject = sub.category;
      }
      // Handle string or other value
      else {
        categoryObject = { _id: sub.category };
      }
    }

    return {
      ...sub,
      category: categoryObject
    };
  });

  // DEBUG: log structure during tests
  if (process.env.NODE_ENV === 'test') {
    // eslint-disable-next-line no-console
    console.log('DBG SUBCATS', subcategories.map(s => ({ id: s._id && s._id.toString(), category: s.category, raw: s && s._doc && s._doc.category })));
  }

  // As a defensive fallback: if populate produced null for the category
  // but the raw document still has the category ObjectId, expose that id
  // as a minimal object so tests can access `category._id`.
  for (let i = 0; i < subcategories.length; i++) {
    const s = subcategories[i];
    if (!s.category) {
      // try to recover the original id from the document's internal data
      const rawCat = (s && s._doc && s._doc.category) || s.category;
      if (rawCat) {
        s.category = { _id: rawCat };
      }
    }
  }

  res.json(subcategories);
});

const getSubcategoryById = asyncHandler(async (req, res) => {
  const subcategory = await Subcategory.findById(req.params.id).populate(
    'category'
  );
  if (!subcategory) {
    res.status(404);
    throw new Error(`Not Found - /api/subcategories/${req.params.id}`);
  }
  res.json(subcategory);
});

const createSubcategory = asyncHandler(async (req, res) => {
  // accept either `category` or `categoryId` field for compatibility with tests
  const { name, description } = req.body;
  const categoryId = req.body.category || req.body.categoryId;

  // cast categoryId to ObjectId when possible
  const mongoose = require('mongoose');
  const catId = (mongoose && mongoose.Types && mongoose.Types.ObjectId && typeof mongoose.Types.ObjectId.isValid === 'function'
    ? mongoose.Types.ObjectId.isValid(categoryId)
    : typeof categoryId === 'string' && /^[0-9a-fA-F]{24}$/.test(categoryId))
    ? mongoose.Types.ObjectId(categoryId)
    : categoryId;

  const category = await Category.findById(catId);
  if (!category) {
    // tests expect a 400 when category does not exist
    res.status(400);
    throw new Error('Invalid category');
  }

  const subcategory = await Subcategory.create({
    name,
    description,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    category: catId,
    isActive: true,
  });

  // If category has subcategories array, add reference
  if (Array.isArray(category.subcategories)) {
    category.subcategories.push(subcategory._id);
    await category.save();
  }

  res.status(201).json(subcategory);
});

const updateSubcategory = asyncHandler(async (req, res) => {
  const subcategory = await Subcategory.findById(req.params.id);
  if (!subcategory) {
    res.status(404);
    throw new Error(`Not Found - /api/subcategories/${req.params.id}`);
  }

  if (req.body.name) {
    subcategory.name = req.body.name;
    subcategory.slug = req.body.name.toLowerCase().replace(/\s+/g, '-');
  }
  if (req.body.description !== undefined) subcategory.description = req.body.description;

  const updated = await subcategory.save();
  res.json(updated);
});

const deleteSubcategory = asyncHandler(async (req, res) => {
  const subcategory = await Subcategory.findById(req.params.id);
  if (!subcategory) {
    res.status(404);
    throw new Error(`Not Found - /api/subcategories/${req.params.id}`);
  }
  // Use deleteOne for compatibility with current Mongoose versions
  await Subcategory.deleteOne({ _id: subcategory._id });
  res.json({ message: 'Subcategory removed' });
});

module.exports = {
  getSubcategories,
  getSubcategoryById,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
};
