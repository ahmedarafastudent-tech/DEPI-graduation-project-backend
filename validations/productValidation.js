const Joi = require('joi');

const imageSchema = Joi.object({
  url: Joi.string().uri().required(),
  publicId: Joi.string()
});

const dimensionsSchema = Joi.object({
  length: Joi.number().min(0),
  width: Joi.number().min(0),
  height: Joi.number().min(0)
});

const variantSchema = Joi.object({
  sku: Joi.string().trim(),
  attributes: Joi.object().pattern(
    Joi.string(),
    Joi.string()
  ).required(),
  price: Joi.number().min(0).required(),
  compareAtPrice: Joi.number().min(0),
  countInStock: Joi.number().integer().min(0).required(),
  images: Joi.array().items(imageSchema),
  weight: Joi.number().min(0),
  dimensions: dimensionsSchema,
  barcode: Joi.string().trim()
});

const reviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required()
    .messages({
      'number.base': 'Rating must be a number',
      'number.integer': 'Rating must be an integer',
      'number.min': 'Rating must be at least 1',
      'number.max': 'Rating must not exceed 5',
      'any.required': 'Rating is required'
    }),
  comment: Joi.string().trim().min(3).max(1000).required()
    .messages({
      'string.empty': 'Comment cannot be empty',
      'string.min': 'Comment must be at least 3 characters long',
      'string.max': 'Comment cannot exceed 1000 characters',
      'any.required': 'Comment is required'
    })
});

const createProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(200).required()
    .messages({
      'string.empty': 'Product name cannot be empty',
      'string.min': 'Product name must be at least 2 characters long',
      'string.max': 'Product name cannot exceed 200 characters',
      'any.required': 'Product name is required'
    }),
  description: Joi.string().trim().min(10).max(2000).required()
    .messages({
      'string.empty': 'Description cannot be empty',
      'string.min': 'Description must be at least 10 characters long',
      'string.max': 'Description cannot exceed 2000 characters',
      'any.required': 'Description is required'
    }),
  category: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
    .messages({
      'string.pattern.base': 'Invalid category ID format',
      'any.required': 'Category is required'
    }),
  subcategory: Joi.string().pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid subcategory ID format'
    }),
  variants: Joi.array().items(variantSchema).min(1).required()
    .messages({
      'array.min': 'At least one variant is required',
      'any.required': 'Product variants are required'
    }),
  brand: Joi.string().trim().max(100),
  tags: Joi.array().items(Joi.string().trim()),
  isActive: Joi.boolean().default(true)
});

const updateProductSchema = createProductSchema.fork(
  ['name', 'description', 'category', 'variants'],
  (schema) => schema.optional()
);

const productQuerySchema = Joi.object({
  search: Joi.string().trim().min(1).max(100),
  category: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
  subcategory: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
  brand: Joi.string().trim(),
  minPrice: Joi.number().min(0),
  maxPrice: Joi.number().min(0),
  inStock: Joi.boolean(),
  isActive: Joi.boolean(),
  sort: Joi.string().valid('price', '-price', 'name', '-name', 'createdAt', '-createdAt'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
}).custom((value, helpers) => {
  if (value.maxPrice && value.minPrice && value.maxPrice < value.minPrice) {
    return helpers.error('object.minPrice', {
      message: 'Maximum price cannot be less than minimum price'
    });
  }
  return value;
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  reviewSchema
};