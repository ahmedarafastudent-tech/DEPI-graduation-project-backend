# API Documentation

## Authentication Endpoints

### Register User
POST /api/auth/register
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "123456"
}
```

### Login User
POST /api/auth/login
```json
{
  "email": "john@example.com",
  "password": "123456"
}
```

## Product Endpoints

### Get All Products
GET /api/products

### Get Single Product
GET /api/products/:id

### Create Product (Admin)
POST /api/products
```json
{
  "name": "Product Name",
  "description": "Product Description",
  "price": 99.99,
  "category": "categoryId",
  "countInStock": 10
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
  "orderItems": [{
    "product": "productId",
    "qty": 2
  }],
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