const { body } = require("express-validator");

const registerValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Please enter a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

const loginValidation = [
  body("email").isEmail().withMessage("Please enter a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

const productValidation = [
  body("name").trim().notEmpty().withMessage("Product name is required"),
  body("description").trim().notEmpty().withMessage("Description is required"),
  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("category").notEmpty().withMessage("Category is required"),
  body("countInStock")
    .isInt({ min: 0 })
    .withMessage("Count in stock must be a non-negative integer"),
];

const categoryValidation = [
  body("name").trim().notEmpty().withMessage("Category name is required"),
  body("description").trim().notEmpty().withMessage("Description is required"),
];

const orderValidation = [
  body("orderItems")
    .isArray()
    .notEmpty()
    .withMessage("Order items are required"),
  body("shippingAddress.address")
    .notEmpty()
    .withMessage("Shipping address is required"),
  body("shippingAddress.city").notEmpty().withMessage("City is required"),
  body("shippingAddress.postalCode")
    .notEmpty()
    .withMessage("Postal code is required"),
  body("shippingAddress.country").notEmpty().withMessage("Country is required"),
  body("paymentMethod").notEmpty().withMessage("Payment method is required"),
];

module.exports = {
  registerValidation,
  loginValidation,
  productValidation,
  categoryValidation,
  orderValidation,
};
