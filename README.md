# E-Commerce API Documentation

## Table of Contents

1. [Getting Started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [Installation](#installation)
   - [Environment Variables](#environment-variables)
2. [Authentication & Users](#authentication)
   - [Register](#register-user)
   - [Login](#login-user)
   - [Email Verification](#email-verification)
   - [Password Reset](#password-reset)
   - [Profile Management](#profile-management)
3. [Products](#products)
   - [Browse & Search](#browse-products)
   - [Product Details](#product-details)
   - [Reviews & Ratings](#reviews-and-ratings)
   - [Featured Products](#featured-products)
4. [Categories & Subcategories](#categories)
   - [Category Management](#category-management)
   - [Subcategory Operations](#subcategory-operations)
   - [Hierarchical Navigation](#hierarchical-navigation)
5. [Cart Management](#cart)
6. [Order Processing](#orders)
7. [Payment Integration](#payments)
8. [Error Handling](#error-handling)
9. [Security & Rate Limiting](#security)
10. [Admin Dashboard](#admin-dashboard)

## Getting Started

### Prerequisites

- Node.js >= 14
- MongoDB >= 4.4
- SMTP Server (for emails)
- PayTabs Account (for payments)

#### Technical Stack

### Core Technologies
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JSON Web Tokens (JWT)
- **API Documentation**: Swagger/OpenAPI
- **Testing**: Jest

### Key Libraries
- **Validation**: express-validator
- **File Upload**: express-fileupload, cloudinary
- **Email**: nodemailer
- **Security**: helmet, cors, rate-limit, xss-clean
- **Payment**: PayTabs integration
- **Logging**: winston

### Project Structure
```
├── config/             # Configuration files
├── controllers/        # Route controllers
├── middleware/         # Custom middleware
├── models/            # Mongoose models
├── routes/            # Express routes
├── utils/             # Utility functions
├── __tests__/         # Test files
└── docs/              # Additional documentation
```

### Design Patterns
- MVC Architecture
- Repository Pattern for data access
- Factory Pattern for object creation
- Strategy Pattern for payment processing
- Observer Pattern for event handling

### Data Models

#### Category
```javascript
{
  name: String,
  slug: String,
  isActive: Boolean,
  subcategories: [{ type: ObjectId, ref: 'Subcategory' }]
}
```

#### Subcategory
```javascript
{
  name: String,
  slug: String,
  description: String,
  category: { type: ObjectId, ref: 'Category', required: true },
  isActive: Boolean
}
```

The subcategory model ensures consistent category references and maintains proper relationships in the database. All responses include properly structured category objects with _id properties for reliable frontend integration.

### Code Quality
- ESLint for code linting
- Prettier for code formatting
- Jest for unit and integration testing
- Input validation and sanitization
- Error handling middleware
- Request rate limiting

# Installation

```bash
# Clone the repository
git clone https://github.com/your-username/ecommerce-backend.git

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configurations

# Run development server
npm run dev

# Run all tests
npm test

# Run specific test file
npm test -- __tests__/auth.test.js

# Run tests with coverage report
npm run test:coverage
```

## Development Guide

### Prerequisites
- Node.js >= 14
- MongoDB >= 4.4
- npm or yarn
- A PayTabs account
- A Cloudinary account
- SMTP server access

### Local Development
1. Clone the repository
2. Install dependencies with `npm install`
3. Copy `.env.example` to `.env` and configure variables
4. Run `npm run dev` for development server
5. Access the API at `http://localhost:5000`
6. View API docs at `http://localhost:5000/api-docs`

### Code Style
- Follow the ESLint configuration
- Use async/await for asynchronous operations
- Write meaningful commit messages
- Document new endpoints in Swagger
- Add tests for new features

### Debugging
- Use the debug configuration in VS Code
- Check logs in the `logs` directory
- Enable debug logging with `DEBUG=app:*`
- Use Postman collections for API testing

## Deployment

### Production Setup
1. Configure production environment variables
2. Build the application: `npm run build`
3. Start the server: `npm start`

### Server Requirements
- Node.js runtime
- MongoDB database
- Adequate disk space for uploads
- SSL certificate for HTTPS
- Process manager (PM2 recommended)

### Deployment Checklist
- [ ] Environment variables configured
- [ ] MongoDB production URI set
- [ ] SSL certificates installed
- [ ] Security headers enabled
- [ ] Rate limiting configured
- [ ] Logging setup
- [ ] Backup strategy in place
- [ ] Monitoring tools configured

### Monitoring
- Use PM2 for process management
- Monitor server resources
- Set up error alerting
- Implement health checks
- Track API metrics

## Support and Updates

For questions and support:
- Create an issue in the repository
- Check the documentation
- Contact the maintainers

Stay updated:
- Watch the repository
- Check for security advisories
- Update dependencies regularly

## Testing Guide

The project uses Jest for testing. Tests are organized in the `__tests__` directory:

### Test Categories
- `auth.test.js` - Authentication and user management
- `products.test.js` - Product operations
- `cart.test.js` - Shopping cart functionality
- `orders.test.js` - Order processing
- `security.test.js` - Security features

### Writing Tests
```javascript
describe('Resource', () => {
  beforeEach(async () => {
    // Setup test database
  });

  afterEach(async () => {
    // Clean up
  });

  it('should perform action', async () => {
    // Test implementation
  });
});
```

### Test Database
Tests use a separate test database configured through `__tests__/setup.js`. The test database is cleared between test runs to ensure test isolation.

### Running Tests in Development
During development, you can use the watch mode:
```bash
npm run test:watch
```

### Environment Variables

Create a `.env` file with the following configurations:

```bash
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=your_mongodb_uri

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d

# Email (SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_email_password
SMTP_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME=Your Store Name

# Frontend URL
FRONTEND_URL=http://localhost:3000

# File Upload (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# PayTabs
PAYTABS_PROFILE_ID=your_profile_id
PAYTABS_SERVER_KEY=your_server_key
PAYTABS_REGION=EGY
PAYTABS_CURRENCY=EGP
```

## API Documentation

The API is divided into the following main sections:

### Authentication
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login with credentials
- `POST /api/v1/auth/verify-email` - Verify email address
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password with token
- `GET /api/v1/auth/me` - Get current user profile
- `PUT /api/v1/auth/update-profile` - Update user profile
- `PUT /api/v1/auth/update-password` - Update password

### Products
- `GET /api/v1/products` - List all products
- `GET /api/v1/products/:id` - Get single product
- `POST /api/v1/products` - Create product (admin)
- `PUT /api/v1/products/:id` - Update product (admin)
- `DELETE /api/v1/products/:id` - Delete product (admin)
- `POST /api/v1/products/:id/reviews` - Add product review
- `GET /api/v1/products/:id/reviews` - Get product reviews

### Categories
- `GET /api/v1/categories` - List all categories
- `GET /api/v1/categories/:id` - Get single category
- `POST /api/v1/categories` - Create category (admin)
- `PUT /api/v1/categories/:id` - Update category (admin)
- `DELETE /api/v1/categories/:id` - Delete category (admin)

### Shopping Cart
- `GET /api/v1/cart` - Get cart items
- `POST /api/v1/cart` - Add item to cart
- `PUT /api/v1/cart/:id` - Update cart item
- `DELETE /api/v1/cart/:id` - Remove cart item

### Orders
- `GET /api/v1/orders` - List user orders
- `GET /api/v1/orders/:id` - Get single order
- `POST /api/v1/orders` - Create new order
- `PUT /api/v1/orders/:id` - Update order status (admin)

### Payments
- `POST /api/v1/payments/process` - Process payment
- `POST /api/v1/payments/verify` - Verify payment

For detailed API documentation with request/response examples, please refer to the Swagger documentation available at `/api-docs` when running the server.

## Features

### For Users
- User authentication with email verification
- Password reset functionality
- Profile management with avatar support
- Browse and search products
- Product reviews and ratings
- Shopping cart management
- Order tracking
- Secure payment processing

### For Admins
- Product management (CRUD operations)
- Category and subcategory management
- Order management
- User management
- Sales statistics
- Featured products control

### Security
- JWT authentication
- Request validation
- XSS protection
- Rate limiting
- CORS configuration
- Secure headers (Helmet)
- File upload restrictions

### Other Features
- Email notifications
- Image upload and optimization
- Error logging
- API documentation
- Automated tests
- Input sanitization
- Pagination and filtering
```

## Getting Started

### Base URL

```
http://localhost:5000
```

### Authentication

All protected routes require a Bearer token in the Authorization header:

```
Authorization: Bearer <your_token>
```

### Response Formats

#### Success Response

```json
{
  "data": {}, // Requested data
  "message": "Success message" // Optional
}
```

#### Error Response

```json
{
  "message": "Error message",
  "stack": "Error stack trace" // Only in development
}
```

### Status Codes

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

## Authentication Endpoints

### Register User

POST /api/auth/register

Request:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "123456"
}
```

Response (200 OK):

```json
{
  "_id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "token": "your_jwt_token"
}
```

### Login User

POST /api/auth/login

Request:

```json
{
  "email": "john@example.com",
  "password": "123456"
}
```

Response (200 OK):

```json
{
  "_id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "token": "your_jwt_token"
}
```

Error Response (401 Unauthorized):

```json
{
  "message": "Invalid email or password"
}
```

## Product Endpoints

### Get All Products

GET /api/products

Query Parameters:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `category`: Filter by category ID
- `search`: Search in product name and description
- `sort`: Sort by field (e.g., 'price', '-price' for descending)

Response (200 OK):

```json
{
  "products": [
    {
      "_id": "product_id",
      "name": "Product Name",
      "description": "Product Description",
      "price": 99.99,
      "category": {
        "_id": "category_id",
        "name": "Category Name"
      },
      "countInStock": 10,
      "createdAt": "2025-10-26T10:00:00.000Z"
    }
  ],
  "page": 1,
  "pages": 5,
  "total": 50
}
```

### Get Single Product

GET /api/products/:id

Response (200 OK):

```json
{
  "_id": "product_id",
  "name": "Product Name",
  "description": "Product Description",
  "price": 99.99,
  "category": {
    "_id": "category_id",
    "name": "Category Name"
  },
  "countInStock": 10,
  "createdAt": "2025-10-26T10:00:00.000Z"
}
```

### Create Product (Admin)

POST /api/products
Protected: Requires admin token

Request:

```json
{
  "name": "Product Name",
  "description": "Product Description",
  "price": 99.99,
  "category": "categoryId",
  "countInStock": 10
}
```

Response (201 Created):

```json
{
  "_id": "product_id",
  "name": "Product Name",
  "description": "Product Description",
  "price": 99.99,
  "category": "categoryId",
  "countInStock": 10,
  "createdAt": "2025-10-26T10:00:00.000Z"
}
```

Error Response (400 Bad Request):

```json
{
  "message": "Name is required"
}
```

## Category Endpoints

### Get All Categories

GET /api/categories

### Create Category (Admin)

POST /api/categories

```json
{
  "name": "Category Name",
  "description": "Category Description"
}
```

## Order Endpoints

### Create Order

POST /api/orders

```json
{
  "orderItems": [
    {
      "product": "productId",
      "qty": 2
    }
  ],
  "shippingAddress": {
    "address": "123 Street",
    "city": "City",
    "postalCode": "12345",
    "country": "Country"
  },
  "paymentMethod": "PayPal",
  "totalPrice": 199.98
}
```

### Get My Orders

GET /api/orders/myorders

### Get Order by ID

GET /api/orders/:id

## Cart Endpoints

### Get Cart

GET /api/cart

- Returns the current user's cart
- Protected route (requires authentication)
- Response includes items array and total price

```json
{
  "items": [
    {
      "product": {
        "_id": "productId",
        "name": "Product Name",
        "price": 99.99
      },
      "qty": 2,
      "price": 99.99
    }
  ],
  "totalPrice": 199.98
}
```

### Add/Update Item in Cart

POST /api/cart

```json
{
  "product": "productId",
  "qty": 2
}
```

- Adds a new item to cart or updates quantity if item exists
- Protected route (requires authentication)
- Returns updated cart

### Update Item Quantity

PUT /api/cart/item/:productId

```json
{
  "qty": 3
}
```

- Updates the quantity of a specific item in the cart
- Protected route (requires authentication)
- Returns updated cart

### Remove Item from Cart

DELETE /api/cart/item/:productId

- Removes a specific item from the cart
- Protected route (requires authentication)
- Returns updated cart

### Clear Cart

DELETE /api/cart

- Removes all items from the cart
- Protected route (requires authentication)
- Returns success message

```json
{
  "message": "Cart cleared"
}
```
