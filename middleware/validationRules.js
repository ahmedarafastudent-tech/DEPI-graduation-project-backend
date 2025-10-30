const { body, param, query } = require('express-validator');
const mongoose = require('mongoose');
const path = require('path');


const createProductValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be 2-100 chars'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isMongoId()
    .withMessage('Invalid category ID'),
];


const isValidObjectId = (value) => {
  try {
    return (
      mongoose.Types.ObjectId.isValid(value) &&
      String(new mongoose.Types.ObjectId(value)) === String(value)
    );
  } catch (error) {
    return false;
  }
};

const sanitizeHTML = (value) => {
  if (!value) return value;
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '') 
    .replace(/expression\s*\(/gi, '') 
    .replace(/url\s*\(/gi, '') 
    .trim();
};

const sanitizeFile = (value) => {
  if (!value) return value;
  const sanitized = path.normalize(value).replace(/^(\.\.[\/\\])+/, '');
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx'];
  if (!allowedExtensions.includes(path.extname(sanitized).toLowerCase())) {
    return '';
  }
  return sanitized;
};

const isValidEmail = (email) => {
  const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return pattern.test(email) && email.length <= 254;
};

const isValidPrice = (price) => {
  // Allow floating point prices but tolerate small binary rounding errors.
  // Prefer storing prices as integer cents for reliability; this helper
  // accepts a number and verifies it has at most 2 decimal places
  // within a tiny floating-point tolerance.
  if (typeof price !== 'number' || !Number.isFinite(price)) return false;
  if (price < 0 || price > 999999.99) return false;
  const rounded = Math.round(price * 100) / 100;
  return Math.abs(price - rounded) < 1e-9;
};
const isValidDate = (date) => {
  const d = new Date(date);
  return (
    d instanceof Date &&
    !isNaN(d) &&
    d.getFullYear() >= 2000 &&
    d.getFullYear() <= 2100
  );
};

const isSecureUrl = (url) => {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' &&
      !parsed.username &&
      !parsed.password &&
      parsed.pathname.indexOf('..') === -1
    );
  } catch (e) {
    return false;
  }
};

const objectIdParam = (field) =>
  param(field).custom(isValidObjectId).withMessage('Invalid ID format');

const priceValidation = body('price')
  .isFloat({ min: 0 })
  .withMessage('Price must be a positive number');

const registerValidation = [
  body('name')
    .trim()
    .customSanitizer(sanitizeHTML)
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage(
      'Name can only contain letters, spaces, hyphens and apostrophes'
    ),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .custom(isValidEmail)
    .withMessage('Invalid email format')
    .normalizeEmail({
      gmail_remove_dots: false,
      gmail_remove_subaddress: false,
    })
    .custom(async (value) => {
      const User = require('../models/userModel');
      const user = await User.findOne({ email: value });
      if (user) {
        throw new Error('Email already exists');
      }
      return true;
    }),
  body('password')
  .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])/) 
    .withMessage(
      'Password must contain at least one number, one uppercase letter and one lowercase letter'
    )
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Invalid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .customSanitizer(sanitizeHTML)
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email')
    .normalizeEmail()
    .custom(async (value, { req }) => {
      const User = require('../models/userModel');
      const user = await User.findOne({ email: value });
      if (user && user._id.toString() !== req.user._id.toString()) {
        throw new Error('Email already in use');
      }
      return true;
    }),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
  .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])/) 
    .withMessage(
      'Password must contain at least one number, one uppercase letter and one lowercase letter'
    ),
  body('avatar')
    .optional()
    .isURL()

    .withMessage('Avatar must be a valid URL'),
];

const productValidation = [
  body('name')
    .trim()
    .customSanitizer(sanitizeHTML)
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  body('description')
    .trim()
    .customSanitizer(sanitizeHTML)
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  priceValidation,
  body('category').custom(isValidObjectId).withMessage('Invalid category ID'),
  body('subcategory')
    .optional()
    .custom(isValidObjectId)
    .withMessage('Invalid subcategory ID'),
  body('countInStock')
    .isInt({ min: 0 })
    .withMessage('Count in stock must be a non-negative integer'),
  body('images').optional().isArray().withMessage('Images must be an array'),
  body('images.*').optional().isURL().withMessage('Image URL must be valid'),
  body('variants')
    .optional()
    .isArray()
    .withMessage('Variants must be an array'),
  body('variants.*.name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Variant name is required'),
  body('variants.*.options')
    .optional()
    .isArray()
    .withMessage('Variant options must be an array'),
];

const categoryValidation = [
  body('name')
    .trim()
    .customSanitizer(sanitizeHTML)
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be between 2 and 50 characters'),
  body('description')
    .trim()
    .customSanitizer(sanitizeHTML)
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('image').optional().isURL().withMessage('Image URL must be valid'),
];

const subcategoryValidation = [
  body('name')
    .trim()
    .customSanitizer(sanitizeHTML)
    .notEmpty()
    .withMessage('Subcategory name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Subcategory name must be between 2 and 50 characters'),
  body('category').custom(isValidObjectId).withMessage('Invalid category ID'),
  body('description')
    .trim()
    .customSanitizer(sanitizeHTML)
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
];

const orderValidation = [
  body('orderItems')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  body('orderItems.*.product')
    .custom(isValidObjectId)
    .withMessage('Invalid product ID'),
  body('orderItems.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('shippingAddress.address')
    .trim()
    .customSanitizer(sanitizeHTML)
    .notEmpty()
    .withMessage('Shipping address is required'),
  body('shippingAddress.city')
    .trim()
    .customSanitizer(sanitizeHTML)
    .notEmpty()
    .withMessage('City is required'),
  body('shippingAddress.postalCode')
    .trim()
    .notEmpty()
    .withMessage('Postal code is required')
    .matches(/^[0-9A-Z]{3,10}$/i)
    .withMessage('Invalid postal code format'),
  body('shippingAddress.country')
    .trim()
    .customSanitizer(sanitizeHTML)
    .notEmpty()
    .withMessage('Country is required'),
  body('paymentMethod')
    .trim()
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['paytabs'])
    .withMessage('Invalid payment method'),
];

const returnValidation = [
  body('orderId').custom(isValidObjectId).withMessage('Invalid order ID'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('Must include at least one item'),
  body('items.*.product')
    .custom(isValidObjectId)
    .withMessage('Invalid product ID'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('reason')
    .trim()
    .customSanitizer(sanitizeHTML)
    .notEmpty()
    .withMessage('Return reason is required')
    .isIn(['defective', 'wrong_item', 'not_as_described', 'other'])
    .withMessage('Invalid return reason'),
  body('comments')
    .optional()
    .trim()
    .customSanitizer(sanitizeHTML)
    .isLength({ max: 500 })
    .withMessage('Comments cannot exceed 500 characters'),
];

const shippingValidation = [
  body('name')
    .trim()
    .customSanitizer(sanitizeHTML)
    .notEmpty()
    .withMessage('Shipping method name is required'),
  body('carrier')
    .trim()
    .customSanitizer(sanitizeHTML)
    .notEmpty()
    .withMessage('Carrier name is required'),
  body('baseRate')
    .isFloat({ min: 0 })
    .withMessage('Base rate must be a positive number'),
  body('ratePerKg')
    .isFloat({ min: 0 })
    .withMessage('Rate per kg must be a positive number'),
  body('regions')
    .isArray({ min: 1 })
    .withMessage('At least one region must be specified'),
  body('regions.*')
    .trim()
    .customSanitizer(sanitizeHTML)
    .notEmpty()
    .withMessage('Region name cannot be empty'),
];

const paymentValidation = {
  create: [
    body('orderId').custom(isValidObjectId).withMessage('Invalid order ID'),
    body('returnUrl')
      .trim()
      .notEmpty()
      .withMessage('Return URL is required')
      .isURL()
      .withMessage('Invalid return URL'),
  ],
  verify: [
    body('tran_ref')
      .trim()
      .notEmpty()
      .withMessage('Transaction reference is required'),
    body('orderId').custom(isValidObjectId).withMessage('Invalid order ID'),
  ],
};

const couponValidation = [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Coupon code is required')
    .matches(/^[A-Z0-9_-]{3,15}$/)
    .withMessage('Invalid coupon code format'),
  body('type')
    .trim()
    .notEmpty()
    .withMessage('Coupon type is required')
    .isIn(['percentage', 'fixed'])
    .withMessage('Invalid coupon type'),
  body('value')
    .isFloat({ min: 0 })
    .withMessage('Value must be a positive number'),
  body('minPurchase')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum purchase must be a positive number'),
  body('maxDiscount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum discount must be a positive number'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format')
    .custom((value, { req }) => {
      if (req.body.startDate && value <= req.body.startDate) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
];

const supportTicketValidation = [
  body('subject')
    .trim()
    .customSanitizer(sanitizeHTML)
    .notEmpty()
    .withMessage('Subject is required')
    .isLength({ min: 5, max: 100 })
    .withMessage('Subject must be between 5 and 100 characters'),
  body('message')
    .trim()
    .customSanitizer(sanitizeHTML)
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Message must be between 10 and 1000 characters'),
  body('priority')
    .trim()
    .notEmpty()
    .withMessage('Priority is required')
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['general', 'technical', 'billing', 'shipping', 'return'])
    .withMessage('Invalid category'),
  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array'),
  body('attachments.*')
    .optional()
    .isURL()
    .withMessage('Attachment URL must be valid'),
];

const cartValidation = {
  addItem: [
    body('productId').custom(isValidObjectId).withMessage('Invalid product ID'),
    body('quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be at least 1'),
    body('variant')
      .optional()
      .isObject()
      .withMessage('Variant must be an object'),
  ],
  updateItem: [
    body('quantity')
      .isInt({ min: 0 })
      .withMessage('Quantity must be a non-negative integer'),
  ],
};

const wishlistValidation = {
  addItem: [
    body('productId').custom(isValidObjectId).withMessage('Invalid product ID'),
  ],
};

const newsletterValidation = {
  subscribe: [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Invalid email')
      .normalizeEmail(),
    body('name')
      .optional()
      .trim()
      .customSanitizer(sanitizeHTML)
      .isLength({ max: 50 })
      .withMessage('Name cannot exceed 50 characters'),
    body('preferences')
      .optional()
      .isArray()
      .withMessage('Preferences must be an array'),
    body('preferences.*')
      .optional()
      .isIn(['promotions', 'newProducts', 'events', 'blog'])
      .withMessage('Invalid preference option'),
  ],
};

const taxValidation = [
  body('name')
    .trim()
    .customSanitizer(sanitizeHTML)
    .notEmpty()
    .withMessage('Tax name is required'),
  body('rate')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Tax rate must be between 0 and 100'),
  body('country')
    .trim()
    .customSanitizer(sanitizeHTML)
    .notEmpty()
    .withMessage('Country is required'),
  body('state').optional().trim().customSanitizer(sanitizeHTML),
  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean'),
];

module.exports = {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  productValidation,
  categoryValidation,
  subcategoryValidation,
  orderValidation,
  returnValidation,
  shippingValidation,
  paymentValidation,
  couponValidation,
  supportTicketValidation,
  cartValidation,
  wishlistValidation,
  newsletterValidation,
  taxValidation,
  objectIdParam,
};
