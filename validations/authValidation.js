const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .trim()
    .required()
    .pattern(/^[a-zA-Z0-9\s]*$/)
    .messages({
      'string.pattern.base': 'Name can only contain letters, numbers and spaces',
      'string.empty': 'Name cannot be empty',
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot be more than 50 characters long',
    }),

  email: Joi.string()
    .email()
    .trim()
    .lowercase()
    .required()
    .messages({
      'string.email': 'Please enter a valid email address',
      'string.empty': 'Email cannot be empty',
    }),

  password: Joi.string()
    .min(8)
    .max(72)
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password cannot be more than 72 characters long',
      'string.empty': 'Password cannot be empty',
    }),
});

const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .trim()
    .lowercase()
    .required()
    .messages({
      'string.email': 'Please enter a valid email address',
      'string.empty': 'Email cannot be empty',
    }),

  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Password cannot be empty',
    }),
});

module.exports = {
  registerSchema,
  loginSchema,
};