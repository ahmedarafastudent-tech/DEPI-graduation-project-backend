# API Documentation

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
  "_id": "user_id",
  "name": "User Name",
  "email": "user@example.com",
  "token": "JWT_TOKEN",
  "isVerified": false
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
  "_id": "user_id",
  "name": "User Name",
  "email": "user@example.com",
  "token": "JWT_TOKEN",
  "isVerified": true
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
  "message": "Email sent",
  "success": true
}
```

Note: In production, this endpoint sends a password reset link via email. The link includes a secure token and points to `${FRONTEND_URL}/reset-password/${token}`. The token expires in 10 minutes.

#### Reset Password
```http
PUT /api/auth/reset-password/:token
Content-Type: application/json

{
  "password": "NewSecurePass123!"
}

Response 200:
{
  "message": "Password reset successful"
}
```

#### Verify Email
```http
GET /api/auth/verify-email/:token

Response 200:
{
  "message": "Email verified successfully"
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
All successful responses follow a consistent format:
```json
{
  "success": true,
  "data": {}, // Response data object
  "message": "Optional success message"
}
```

#### Error Responses
All errors follow this format:
```json
{
  "success": false,
  "message": "Error description",
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
     - Email sending is mocked
     - `sendEmail()` returns `{ success: true }`
     - No real SMTP connection is made
   - In development/production:
     - Real SMTP settings required
     - Returns `{ success: true }` on successful send
     - Throws error on failure

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

## Categories & Subcategories

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
- 404 Not Found: Subcategory not found