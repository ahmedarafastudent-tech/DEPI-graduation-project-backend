# E-Commerce API Documentation

## Quick Start

### For Backend Developers

1. Clone the repository:

   ```bash
   git clone https://github.com/ahmedarafastudent-tech/DEPI-graduation-project-backend.git
   cd DEPI-graduation-project-backend
   ```

2. Set up environment:

   ```bash
   cp .env.example .env
   # Edit .env with your values
   npm install
   ```

3. Configure environment:
   Required in `.env` for local development:

   ```bash
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   CORS_ORIGINS=http://localhost:3000,http://localhost:5173

   # Database
   MONGO_URI=mongodb://localhost:27017/your_db
   MONGO_TEST_URI=mongodb://localhost:27017/test_db

   # Authentication
   JWT_SECRET=your_secret
   JWT_EXPIRE=7d
   JWT_COOKIE_EXPIRE=7

   # Email Configuration
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_USER=your_email@example.com
   SMTP_PASS=your_password
   EMAIL_FROM=noreply@yourdomain.com
   EMAIL_FROM_NAME=Your App Name

   # Rate Limiting
   RATE_LIMIT_WINDOW=15
   RATE_LIMIT_MAX=100
   AUTH_RATE_LIMIT_MAX=50
   ```

   Notes:
   - For development, use services like Mailtrap for email testing
   - In test environment, emails are logged but not sent
   - JWT_SECRET in tests is fixed as 'testsecret123'

4. Start development server:

   ```bash
   npm run dev
   ```

   This validates the environment and starts nodemon.

5. Run tests:

   ```bash
   npm test              # Run all tests
   npm run test:watch    # Run tests in watch mode
   npm run test:coverage # Run tests with coverage
   ```

6. Test email functionality:
   - In test environment: Emails are mocked (see `__tests__/mocks/mailMock.js`)
   - In development: Configure SMTP or use a service like Mailtrap
   - Check `utils/sendEmail.js` for implementation details

### For Frontend Developers

1. Base URL & CORS:
   - Development: `http://localhost:3000`
   - Your frontend origin must be listed in backend's `CORS_ORIGINS` or `FRONTEND_URL`
   - For multiple origins, use comma-separated list in `CORS_ORIGINS`

2. Authentication:
   - Include JWT token in all authenticated requests:
     ```http
     Authorization: Bearer <token>
     ```
   - Get token via `/api/auth/login` or `/api/auth/register`
   - Token expires in 7 days (configurable via `JWT_EXPIRE`)
   - All authenticated endpoints return `{ success: true }` on success

3. Email Verification & Password Reset:
   - Frontend needs routes for:
     - `/verify-email/:token` (GET)
     - `/reset-password/:token` (GET)
   - These URLs are sent in verification/reset emails
   - Configure `FRONTEND_URL` in backend `.env` to match your domain
   - Email verification is required for new accounts

4. Rate Limiting:
   - Auth routes: 50 requests per 15 minutes
   - Other routes: 100 requests per 15 minutes
   - Check response headers for limits and remaining requests
   - `X-RateLimit-Limit` and `X-RateLimit-Remaining` headers

5. Frontend Environment:
   ```bash
   # Vite
   VITE_API_URL=http://localhost:5000

   # Create React App
   REACT_APP_API_URL=http://localhost:5000

   # Next.js
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

## Table of Contents

1. [Environment Setup](#environment-setup)
2. [Authentication](#authentication)
3. [Products](#products)
4. [Categories](#categories)
5. [Cart & Orders](#cart-and-orders)
6. [Payments](#payments)
7. [Error Handling](#error-handling)
8. [Security](#security)
9. [Admin Features](#admin-features)
10. [Testing Guide](#testing-guide)

## Environment Setup

### Environment Variables

Copy `.env.example` to `.env` and configure the following:

#### Required Variables

```bash
# Server
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/your_database
JWT_SECRET=your_jwt_secret

# Email (for auth flows)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_password
```

#### Optional Overrides

```bash
# Custom hosts (defaults shown)
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000
CORS_ORIGINS=http://localhost:3000  # comma-separated for multiple

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX=100           # requests per window

# See .env.example for all options
```

### Host Configuration

1. Development Defaults:
   - Frontend: `http://localhost:3000`
   - Backend: `http://localhost:5000`

2. Custom Deployment:

   ```bash
   # Frontend on Vercel
   FRONTEND_URL=https://my-app.vercel.app

   # Multiple frontend origins
   CORS_ORIGINS=http://localhost:3000,https://staging.app.com

   # Custom backend URL (for generated links)
   BACKEND_URL=https://api.myapp.com
   ```

Use `npm run validate:env` to verify your configuration.

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

The subcategory model ensures consistent category references and maintains proper relationships in the database. All responses include properly structured category objects with \_id properties for reliable frontend integration.

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

### Environment variables

The application reads configuration from environment variables. Copy the example file and update values for your environment:

```bash
cp .env.example .env
# edit .env with your values
```

Key environment variables (see `.env.example` for the full list and descriptions):

- PORT — server port (default 5000)
- NODE_ENV — environment (development | test | production)
- MONGO_URI — MongoDB connection string for production/dev
- MONGO_POOL_SIZE — optional DB pool size
- JWT_SECRET — secret used to sign JWT tokens (required in production)
- JWT_EXPIRE — token expiry (e.g. 30d)
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS — SMTP settings for emails
- SMTP_FROM_EMAIL / SMTP_FROM_NAME — email sender defaults
- CORS_ORIGINS (or FRONTEND_URL) — allowed frontend origin(s) for CORS (comma separated)
- RATE_LIMIT_MAX_REQUESTS — API requests allowed per window (adjust for production)
- CLOUDINARY\_\* — Cloudinary credentials for uploads
- PAYTABS_PROFILE_ID, PAYTABS_SERVER_KEY, PAYTABS_REGION — payment provider settings

Notes:

- In tests, the project provides safe test fallbacks (e.g. `testsecret123`) so the test suite can run without real secrets. Do NOT use test fallbacks in production.
- Keep your production secrets out of source control and use a secrets manager when possible.

If you need a reference, open `.env.example` which lists every variable the app reads and short guidance for each.

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

````

## Getting Started

### For frontend developers

- Base API URL (development): `http://localhost:3000`
- When running the backend locally, set your frontend app to use the base URL above or configure it in your frontend `.env` (for example `VITE_API_BASE_URL` or `REACT_APP_API_BASE_URL`).
- CORS: the backend accepts origins configured via `CORS_ORIGINS` (comma-separated) or `FRONTEND_URL` in `.env` — make sure the origin used by your frontend is present there.
- Authentication: protected endpoints require an Authorization header with a Bearer JWT token.

Example request (get current user):

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/v1/auth/me
````

### For backend developers

- Quick start:
  1. Copy `.env.example` to `.env` and fill required values.
  2. Install dependencies: `npm install`.
  3. Start dev server: `npm run dev` (this runs the app without requiring production env variables).
  4. Run tests: `npm test`.

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
