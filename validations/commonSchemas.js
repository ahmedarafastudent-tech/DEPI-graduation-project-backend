const Joi = require('joi');


const commonSchemas = {

  pagination: {
    page: Joi.number().integer().min(1).default(1)
      .messages({
        'number.base': 'Page must be a number',
        'number.integer': 'Page must be an integer',
        'number.min': 'Page must be greater than 0'
      }),
    limit: Joi.number().integer().min(1).max(100).default(20)
      .messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be greater than 0',
        'number.max': 'Limit cannot exceed 100'
      }),
    sort: Joi.string().pattern(/^[a-zA-Z]+(,[a-zA-Z]+)*$/)
      .messages({
        'string.pattern.base': 'Invalid sort format'
      }),
    fields: Joi.string().pattern(/^[a-zA-Z]+(,[a-zA-Z]+)*$/)
      .messages({
        'string.pattern.base': 'Invalid fields format'
      })
  },


  objectId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid ID format'
    }),


  email: Joi.string()
    .email()
    .trim()
    .lowercase()
    .messages({
      'string.email': 'Please enter a valid email address',
      'string.empty': 'Email cannot be empty'
    }),

  password: Joi.string()
    .min(8)
    .max(72)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password cannot be more than 72 characters long'
    }),

  dateRange: {
    startDate: Joi.date().iso()
      .messages({
        'date.base': 'Start date must be a valid date',
        'date.format': 'Start date must be in ISO format'
      }),
    endDate: Joi.date().iso().min(Joi.ref('startDate'))
      .messages({
        'date.base': 'End date must be a valid date',
        'date.format': 'End date must be in ISO format',
        'date.min': 'End date cannot be before start date'
      })
  },


  search: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .messages({
      'string.min': 'Search query must be at least 1 character long',
      'string.max': 'Search query cannot exceed 100 characters'
    }),

  imageUrl: Joi.string()
    .uri()
    .pattern(/\.(jpg|jpeg|png|gif)$/i)
    .messages({
      'string.uri': 'Invalid image URL format',
      'string.pattern.base': 'URL must point to an image file (jpg, jpeg, png, gif)'
    }),

  phone: Joi.string()
    .pattern(/^\+?[\d\s-]{10,}$/)
    .messages({
      'string.pattern.base': 'Invalid phone number format'
    }),

  currency: Joi.number()
    .precision(2)
    .positive()
    .messages({
      'number.base': 'Amount must be a number',
      'number.positive': 'Amount must be positive',
      'number.precision': 'Amount cannot have more than 2 decimal places'
    }),

  flag: Joi.boolean()
    .messages({
      'boolean.base': 'Flag must be a boolean value'
    }),

  timestamp: Joi.date()
    .iso()
    .messages({
      'date.base': 'Must be a valid date',
      'date.format': 'Must be in ISO format'
    })
};

const createPaginationSchema = (options = {}) => {
  const { maxLimit = 100, defaultLimit = 20 } = options;
  
  return Joi.object({
    page: commonSchemas.pagination.page,
    limit: Joi.number()
      .integer()
      .min(1)
      .max(maxLimit)
      .default(defaultLimit)
      .messages({
        'number.max': `Limit cannot exceed ${maxLimit}`
      }),
    sort: commonSchemas.pagination.sort,
    fields: commonSchemas.pagination.fields
  });
};

module.exports = {
  commonSchemas,
  createPaginationSchema
};