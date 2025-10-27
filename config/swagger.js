const swaggerJsdoc = require('swagger-jsdoc');
const packageJson = require('../package.json');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-Commerce API Documentation',
      version: packageJson.version,
      description: `
Complete API documentation for the E-Commerce platform.

## Features
- User Authentication and Authorization
- Product Management
- Order Processing
- Payment Integration with PayTabs
- Cart and Wishlist Management
- Category and Subcategory Organization
- Coupon and Discount System
- Shipping and Tax Calculation
- Support Ticket System
- Analytics and Reporting

## Environment
- Node.js ${process.version}
- Environment: ${process.env.NODE_ENV || 'development'}
      `,
      contact: {
        name: 'API Support',
        email: process.env.SUPPORT_EMAIL || 'support@example.com',
        url: process.env.SUPPORT_URL || 'https://example.com/support',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: process.env.BACKEND_URL || 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: process.env.STAGING_URL || 'https://staging-api.example.com',
        description: 'Staging server',
      },
      {
        url: process.env.PRODUCTION_URL || 'https://api.example.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from login or registration',
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for external service integrations',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'error',
            },
            message: {
              type: 'string',
              example: 'Error message description',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    example: 'email',
                  },
                  message: {
                    type: 'string',
                    example: 'Invalid email format',
                  },
                },
              },
            },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'error',
            },
            message: {
              type: 'string',
              example: 'Validation failed',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                  },
                  message: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication failed or token expired',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    example: 'error',
                  },
                  message: {
                    type: 'string',
                    example: 'Not authorized, token failed',
                  },
                },
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ValidationError',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    example: 'error',
                  },
                  message: {
                    type: 'string',
                    example: 'Resource not found',
                  },
                },
              },
            },
          },
        },
      },
      parameters: {
        IdParam: {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            pattern: '^[0-9a-fA-F]{24}$',
          },
          description: 'MongoDB ObjectId',
        },
        PageParam: {
          name: 'page',
          in: 'query',
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1,
          },
          description: 'Page number for pagination',
        },
        LimitParam: {
          name: 'limit',
          in: 'query',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 10,
          },
          description: 'Number of items per page',
        },
        SortParam: {
          name: 'sort',
          in: 'query',
          schema: {
            type: 'string',
            example: '-createdAt',
          },
          description: 'Sort field and order (prefix with - for descending)',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Users', description: 'User management endpoints' },
      { name: 'Products', description: 'Product management endpoints' },
      { name: 'Categories', description: 'Category management endpoints' },
      { name: 'Orders', description: 'Order management endpoints' },
      { name: 'Payments', description: 'Payment processing endpoints' },
      { name: 'Cart', description: 'Shopping cart endpoints' },
      { name: 'Wishlist', description: 'Wishlist management endpoints' },
      { name: 'Support', description: 'Customer support endpoints' },
      { name: 'Analytics', description: 'Analytics and reporting endpoints' },
    ],
  },
  apis: ['./routes/*.js', './docs/**/*.yaml'],
  // Include full documentation
  includeApiInResponse: true,
};

// Custom response validation
const validateResponse = (req, res, spec) => {
  const responseValidation = spec.validateResponse(req, res);
  if (!responseValidation.valid) {
    console.error('Response validation failed:', responseValidation.errors);
  }
  return responseValidation.valid;
};

// Export both the Swagger spec and validation function
module.exports = {
  swaggerSpec: swaggerJsdoc(options),
  validateResponse,
};
