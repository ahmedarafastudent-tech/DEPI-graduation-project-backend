# API Documentation (Updated October 2025)

## Base URLs
- Development: `http://localhost:5000`
- Test: Set via `BACKEND_URL` in `.env`
- Production: Your deployed API URL

## Quick Reference

### Base URL
- Development: `http://localhost:5000`
- Custom: Set via `BACKEND_URL` in `.env`

### Authentication

All protected routes require a JWT token in the Authorization header:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

#### Register a New User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "User Name",
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response 201:
{
  "success": true,
  "data": {
    "_id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "token": "JWT_TOKEN",
    "isVerified": false
  },
  "message": "User registered successfully"
}
```


#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response 200:
{
  "success": true,
  "data": {
    "_id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "token": "JWT_TOKEN",
    "isVerified": true
  },
  "message": "Authentication successful"
}
```

#### Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}

Response 200:
{
  "success": true,
  "message": "Password reset email sent",
  "data": null
}
```

Note: In production, this endpoint sends a password reset link via email. The link includes a secure token and points to `${FRONTEND_URL}/reset-password/${token}`. The token expires in 10 minutes.

In test environments (`NODE_ENV=test`) email sending is mocked and tokens are usually logged to the test output (or returned by test helpers) so you can assert their values without requiring a real SMTP server.

#### Reset Password
```http
PUT /api/auth/reset-password/:token
Content-Type: application/json

{
  "password": "NewSecurePass123!"
}

Response 200:
{
  "success": true,
  "message": "Password reset successful",
  "data": null
}
```

#### Verify Email
```http
GET /api/auth/verify-email/:token

Response 200:
{
  "success": true,
  "message": "Email verified successfully",
  "data": null
}
```

Note: Email verification tokens are sent during registration and expire after 24 hours.

### CORS Configuration
1. Default: Allows `http://localhost:3000`
2. Configure via `.env`:
   ```bash
   # Single origin
   FRONTEND_URL=https://myapp.com

   # Multiple origins
   CORS_ORIGINS=https://app1.com,https://app2.com
   ```

### Rate Limiting
1. Standard routes: 100 requests per 15 minutes
2. Auth routes: 50 requests per 15 minutes
3. Configure via `.env`:
   ```bash
   RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
   RATE_LIMIT_MAX=100           # requests per window
   ```
4. Custom headers returned:
   - `X-RateLimit-Limit`
   - `X-RateLimit-Remaining`
   - `X-RateLimit-Reset`

### Response Format

#### Success Responses
All successful responses follow a consistent format used across the API (helps frontend map responses easily):

```json
{
  "success": true,
  "data": { /* resource payload or null */ },
  "message": "Optional human-readable message"
}
```

#### Error Responses
All errors follow this format. In development the `stack` field may be included for debugging; it is omitted in production responses.

```json
{
  "success": false,
  "message": "Error description",
  "details": { /* optional validation details */ },
  "stack": "Error stack trace (development only)"
}
```

Common HTTP status codes:
- 400: Bad Request (validation error)
- 401: Unauthorized (invalid/missing token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 429: Too Many Requests (rate limit exceeded)
- 500: Internal Server Error

### Testing Notes

1. Email Behavior:
   - In test environment (`NODE_ENV=test`):
     - Email sending is mocked by the test suite. The `sendEmail()` helper resolves with `{ success: true, info: { /* transporter info */ } }` or the tests stub the module and return predictable tokens. No SMTP connection is made.
   - In development/production:
     - Provide valid SMTP settings in `.env` (see `.env.example` / `.env.sample`).
     - The `sendEmail()` utility returns `{ success: true, info }` on success and throws/returns an error on failure.
   - Frontend integration:
     - Email bodies include links built from `FRONTEND_URL` + paths `/verify-email/:token` and `/reset-password/:token`. Ensure that your frontend routes match these paths.

2. Test Users:
   - Use `POST /api/auth/register` to create test users
   - Default password requirements:
     - Minimum 8 characters
     - At least: 1 uppercase, 1 lowercase, 1 number, 1 special character

3. Authentication:
   - Test environment uses `testsecret123` as JWT secret
   - Token expiry is same as production (7 days default)
   - Use Bearer token scheme for all protected routes

### Environment Setup
See `.env.example` in the root directory for all configuration options. Key variables:

```bash
# Required
PORT=5000
MONGO_URI=mongodb://localhost:27017/your_db
JWT_SECRET=your_secret_key

# Optional
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000
CORS_ORIGINS=http://localhost:3000
RATE_LIMIT_MAX=100
```

Seeding / Sample Data:

- This repo includes a seeder script (`scripts/seed.js`) which populates development collections with sample users, categories, products and related data. Run it with:

```bash
# Make sure `.env` points to a local development MongoDB instance
npm run seed
```

- There are also JSON files under `scripts/seed-data/` for manual import via MongoDB Compass. Prefer running the seeder when you need properly linked documents (hashed passwords, references, generated SKUs).

## Categories & Subcategories

### Categories API Endpoints

#### List Categories
```http
GET /api/categories
```

Query Parameters:
- `search` (optional): full-text search on category name
- `isActive` (optional): `true` or `false` to filter by active state
- `includeCounts` (optional): `true` to include product/subcategory counts per category

Example:
```
GET /api/categories?search=electronics&isActive=true&includeCounts=true
```

Response (200):
```json
{
  "success": true,
  "data": [
    {
      "_id": "category_id",
      "name": "Electronics",
      "slug": "electronics",
      "isActive": true,
      "counts": { "products": 124, "subcategories": 6 }
    }
  ]
}
```

#### Get Category by ID
```http
GET /api/categories/:id
```

#### Create Category (Admin Only)
```http
POST /api/categories
```

Request body:
```json
{ "name": "Category Name" }
```

#### Update Category (Admin Only)
```http
PUT /api/categories/:id
```

#### Update Category Status (Admin Only)
Enable or disable a category without removing it from the DB.

```http
PUT /api/categories/:id/status
Content-Type: application/json

{
  "isActive": true
}
```

Response (200):
```json
{
  "success": true,
  "data": { "_id": "category_id", "isActive": true },
  "message": "Category status updated"
}
```

Notes:
- The status endpoint is admin-protected. Use an admin Bearer token in the `Authorization` header.
- This endpoint is useful to temporarily hide categories from public listings without deleting them.

### Subcategories API Endpoints

#### List Subcategories
```http
GET /api/subcategories
```

Query Parameters:
- `category` (optional): Filter subcategories by category ID

Response Format:
```json
[
  {
    "_id": "subcategory_id",
    "name": "Subcategory Name",
    "slug": "subcategory-name",
    "description": "Optional description",
    "category": {
      "_id": "category_id"
    },
    "isActive": true,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
]
```

#### Get Subcategory by ID
```http
GET /api/subcategories/:id
```

Response includes full category object through population.

#### Create Subcategory (Admin Only)
```http
POST /api/subcategories
```

Request Body:
```json
{
  "name": "Subcategory Name",
  "description": "Optional description",
  "category": "category_id"
}
```

#### Update Subcategory (Admin Only)
```http
PUT /api/subcategories/:id
```

Request Body:
```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

#### Delete Subcategory (Admin Only)
```http
DELETE /api/subcategories/:id
```

### Important Notes

1. Category References:
   - All subcategories must belong to a valid category
   - Category IDs are validated before creation
   - Category objects are consistently structured in responses

2. Slug Generation:
   - Automatically generated from name
   - Lowercase with hyphens replacing spaces
   - Updated when name is changed

3. Security:
   - Create/Update/Delete operations require admin privileges
   - List/Get operations are public
   - Proper validation of category existence

4. Response Format:
   - Category is always returned as an object with _id
   - Consistent structure for all endpoints
   - Proper error responses for invalid operations

### Error Responses

- 400 Bad Request: Invalid category ID or validation errors
- 401 Unauthorized: Authentication required
- 403 Forbidden: Not authorized as admin
- - 404 Not Found: Subcategory not found

## Newsletter Management

### Subscribe to Newsletter
```http
POST /api/newsletter/subscribe
Content-Type: application/json

{
  "email": "subscriber@example.com",
  "preferences": ["promotions", "news", "updates"]
}

Response 201:
{
  "success": true,
  "data": {
    "email": "subscriber@example.com",
    "preferences": ["promotions", "news", "updates"],
    "isSubscribed": true,
    "subscribedAt": "2025-10-30T00:00:00.000Z"
  }
}
```

### Unsubscribe from Newsletter
```http
POST /api/newsletter/unsubscribe
Content-Type: application/json

{
  "email": "subscriber@example.com"
}

Response 200:
{
  "success": true,
  "data": {
    "email": "subscriber@example.com",
    "isSubscribed": false
  }
}
```

### Update Preferences (Authenticated)
```http
PUT /api/newsletter/preferences
Content-Type: application/json

{
  "preferences": ["promotions", "news"]
}

Response 200:
{
  "success": true,
  "data": {
    "email": "user@example.com",
    "preferences": ["promotions", "news"],
    "updatedAt": "2025-10-30T00:00:00.000Z"
  }
}
```

## Tax Management

### Create Tax Rate (Admin)
```http
POST /api/tax
Content-Type: application/json

{
  "name": "US Sales Tax",
  "rate": 8.5,
  "region": "US",
  "isDefault": true,
  "applicableItems": ["physical", "digital"]
}

Response 201:
{
  "success": true,
  "data": {
    "_id": "tax_id",
    "name": "US Sales Tax",
    "rate": 8.5,
    "region": "US",
    "isDefault": true,
    "applicableItems": ["physical", "digital"],
    "createdAt": "2025-10-30T00:00:00.000Z"
  }
}
```

### Calculate Tax for Order
```http
POST /api/tax/calculate
Content-Type: application/json

{
  "subtotal": 100.00,
  "items": [
    {
      "type": "physical",
      "price": 80.00
    },
    {
      "type": "digital",
      "price": 20.00
    }
  ],
  "region": "US"
}

Response 200:
{
  "success": true,
  "data": {
    "subtotal": 100.00,
    "taxAmount": 8.50,
    "total": 108.50,
    "breakdown": {
      "physical": {
        "amount": 6.80,
        "rate": 8.5
      },
      "digital": {
        "amount": 1.70,
        "rate": 8.5
      }
    }
  }
}
```

## Returns Management

### Create Return Request
```http
POST /api/returns
Content-Type: application/json

{
  "orderId": "order_id",
  "items": [
    {
      "productId": "product_id",
      "quantity": 1,
      "reason": "defective",
      "condition": "unopened"
    }
  ],
  "reason": "Product arrived damaged",
  "preferredOutcome": "refund"
}

Response 201:
{
  "success": true,
  "data": {
    "_id": "return_id",
    "status": "pending",
    "items": [{
      "productId": "product_id",
      "quantity": 1,
      "reason": "defective",
      "condition": "unopened"
    }],
    "reason": "Product arrived damaged",
    "preferredOutcome": "refund",
    "createdAt": "2025-10-30T00:00:00.000Z"
  }
}
```

### Process Return (Admin)
```http
PUT /api/returns/:id
Content-Type: application/json

{
  "status": "approved",
  "adminNotes": "Refund approved",
  "refundAmount": 100.00
}

Response 200:
{
  "success": true,
  "data": {
    "_id": "return_id",
    "status": "approved",
    "refundAmount": 100.00,
    "processedAt": "2025-10-30T00:00:00.000Z"
  }
}
```

### Get Return Details
```http
GET /api/returns/:id

Response 200:
{
  "success": true,
  "data": {
    "_id": "return_id",
    "status": "approved",
    "items": [...],
    "timeline": [
      {
        "status": "pending",
        "timestamp": "2025-10-30T00:00:00.000Z"
      },
      {
        "status": "approved",
        "timestamp": "2025-10-30T01:00:00.000Z"
      }
    ]
  }
}
```

## Wishlist Management

### Add Item to Wishlist
```http
POST /api/wishlist
Content-Type: application/json

{
  "productId": "product_id"
}

Response 201:
{
  "success": true,
  "data": {
    "_id": "wishlist_id",
    "products": [
      {
        "_id": "product_id",
        "name": "Product Name",
        "price": 99.99,
        "addedAt": "2025-10-30T00:00:00.000Z"
      }
    ]
  }
}
```

### Remove Item from Wishlist
```http
DELETE /api/wishlist/:productId

Response 200:
{
  "success": true,
  "message": "Item removed from wishlist"
}
```

### Move Item to Cart
```http
POST /api/wishlist/:productId/move-to-cart

Response 200:
{
  "success": true,
  "data": {
    "wishlist": { /* updated wishlist */ },
    "cart": { /* updated cart */ }
  }
}
```

### Get Wishlist
```http
GET /api/wishlist

Response 200:
{
  "success": true,
  "data": {
    "_id": "wishlist_id",
    "products": [
      {
        "_id": "product_id",
        "name": "Product Name",
        "price": 99.99,
        "inStock": true,
        "addedAt": "2025-10-30T00:00:00.000Z"
      }
    ]
  }
}
```
```