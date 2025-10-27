const request = require('supertest');
const app = require('../index');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const User = require('../models/userModel');

async function createTestUser(isAdmin = false) {
  const user = await User.create({
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    password: 'Test123',
    isAdmin,
  });
  const token = user.generateToken();
  return { user, token };
}

describe('Product Endpoints', () => {
  let testUser, adminUser, category;

  beforeEach(async () => {
    const userResponse = await createTestUser(false);
    testUser = userResponse.token;

    const adminResponse = await createTestUser(true);
    adminUser = adminResponse.token;

    category = await Category.create({
      name: 'Test Category',
      description: 'Test Description',
    });
  });

  describe('GET /api/products', () => {
    beforeEach(async () => {
      const sellerResponse = await createTestUser(false);
      const seller = sellerResponse.user;
      await Product.create([
        {
          name: 'Product 1',
          description: 'Description 1',
          price: 99.99,
          category: category._id,
          countInStock: 10,
          seller: seller._id,
        },
        {
          name: 'Product 2',
          description: 'Description 2',
          price: 149.99,
          category: category._id,
          countInStock: 5,
          seller: seller._id,
        },
      ]);
    });

    it('should fetch all products', async () => {
      const res = await request(app).get('/api/products');

      expect(res.statusCode).toBe(200);
      expect(res.body.products).toHaveLength(2);
      expect(res.body).toHaveProperty('page');
      expect(res.body).toHaveProperty('pages');
    });

    it('should filter products by category', async () => {
      const res = await request(app).get(`/api/products?category=${category._id}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.products).toHaveLength(2);
    });

    it('should sort products by price', async () => {
      const res = await request(app).get('/api/products?sort=-price');

      expect(res.statusCode).toBe(200);
      expect(res.body.products[0].price).toBe(149.99);
    });
  });

  describe('POST /api/products', () => {
    it('should create product with admin token', async () => {
      const adminResponse = await createTestUser(true);
      const seller = adminResponse.user;
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminUser}`)
        .send({
          name: 'New Product',
          description: 'New Description',
          price: 199.99,
          category: category._id,
          countInStock: 15,
          seller: seller._id,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.name).toBe('New Product');
    });

    it('should not create product without admin token', async () => {
      const userResponse = await createTestUser(false);
      const seller = userResponse.user;
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${testUser}`)
        .send({
          name: 'New Product',
          description: 'New Description',
          price: 199.99,
          category: category._id,
          countInStock: 15,
          seller: seller._id,
        });

      expect(res.statusCode).toBe(403);
    });
  });
});
