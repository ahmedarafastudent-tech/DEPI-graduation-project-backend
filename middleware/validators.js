const { body } = require("express-validator");

const validateProduct = [
  body("name").notEmpty().trim().withMessage("Product name is required"),
  body("description").notEmpty().trim().withMessage("Description is required"),
  body("price").isNumeric().withMessage("Price must be a number"),
  body("category").notEmpty().withMessage("Category is required"),
  body("countInStock")
    .isInt({ min: 0 })
    .withMessage("Count in stock must be a positive number"),
];

const validateCategory = [
  body("name").notEmpty().trim().withMessage("Category name is required"),
  body("description").notEmpty().trim().withMessage("Description is required"),
];

const validateOrder = [
  body("orderItems")
    .isArray()
    .notEmpty()
    .withMessage("Order items are required"),
  body("shippingAddress")
    .notEmpty()
    .withMessage("Shipping address is required"),
  body("paymentMethod").notEmpty().withMessage("Payment method is required"),
  body("totalPrice").isNumeric().withMessage("Total price must be a number"),
];

module.exports = {
  validateProduct,
  validateCategory,
  validateOrder,
};
