const mongoose = require('mongoose');
const app = require('../index');
const supertest = require('supertest');
const request = (appParam) => global.request || supertest(appParam);
const Category = require('../models/categoryModel');
const User = require('../models/userModel');
const { generateToken } = require('../utils/generateToken');

describe('Category Controller Tests', () => {
  let adminToken;
  let userToken;
  let admin;
  let user;

  beforeAll(async () => {
    await User.deleteMany({}); // Clean up users before tests
    await Category.deleteMany({}); // Clean up categories before tests

    const { user: adminUser, token } = await createUserAndToken(app, { isAdmin: true });
    admin = adminUser;
    adminToken = token;

    const { user: regularUser, token: regularToken } = await createUserAndToken(app, { isAdmin: false });
    user = regularUser;
    userToken = regularToken;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Category.deleteMany({});
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  beforeEach(async () => {
    await Category.deleteMany({});
  });

  describe('POST /api/categories', () => {
    it('should create a category when admin', async () => {
      const categoryData = {
        name: 'Electronics',
        description: 'Electronic devices and accessories',
        image: '/images/electronics.jpg'
      };

      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoryData);

      expect(res.statusCode).toBe(201);
      expect(res.body.name).toBe('Electronics');
      expect(res.body.slug).toBe('electronics');
    });

    it('should not allow regular users to create categories', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Electronics'
        });

  expect(res.statusCode).toBe(403);
    });

    it('should not allow duplicate category names', async () => {
      await Category.create({
        name: 'Electronics',
        slug: 'electronics'
      });

      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Electronics'
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/categories', () => {
    beforeEach(async () => {
      await Category.create([
        {
          name: 'Electronics',
          slug: 'electronics',
          isActive: true
        },
        {
          name: 'Clothing',
          slug: 'clothing',
          isActive: true
        }
      ]);
    });

    it('should return all active categories', async () => {
      const res = await request(app)
        .get('/api/categories');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('should include category counts when requested', async () => {
      const res = await request(app)
        .get('/api/categories')
        .query({ includeCounts: true });

      expect(res.statusCode).toBe(200);
      expect(res.body[0]).toHaveProperty('productCount');
    });
  });

  describe('GET /api/categories/:id', () => {
    let category;

    beforeEach(async () => {
      category = await Category.create({
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices',
        isActive: true
      });
    });

    it('should get category by ID', async () => {
      const res = await request(app)
        .get(`/api/categories/${category._id}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('Electronics');
    });

    it('should return 404 for non-existent category', async () => {
      const res = await request(app)
        .get(`/api/categories/${mongoose.Types.ObjectId()}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/categories/:id', () => {
    let category;

    beforeEach(async () => {
      category = await Category.create({
        name: 'Electronics',
        slug: 'electronics',
        isActive: true
      });
    });

    it('should update category when admin', async () => {
      const res = await request(app)
        .put(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Electronics',
          description: 'Updated description'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('Updated Electronics');
      expect(res.body.slug).toBe('updated-electronics');
    });

    it('should not allow regular users to update categories', async () => {
      const res = await request(app)
        .put(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Updated Electronics'
        });

  expect(res.statusCode).toBe(403);
    });
  });

  describe('DELETE /api/categories/:id', () => {
    let category;

    beforeEach(async () => {
      category = await Category.create({
        name: 'Electronics',
        slug: 'electronics',
        isActive: true
      });
    });

    it('should delete category when admin', async () => {
      const res = await request(app)
        .delete(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Category removed');
    });

    it('should not allow regular users to delete categories', async () => {
      const res = await request(app)
        .delete(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${userToken}`);

  expect(res.statusCode).toBe(403);
    });
  });
});