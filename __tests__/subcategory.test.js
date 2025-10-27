const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../index');
const Subcategory = require('../models/subcategoryModel');
const Category = require('../models/categoryModel');
const User = require('../models/userModel');
const { generateToken } = require('../utils/generateToken');

describe('Subcategory Controller Tests', () => {
  let adminToken;
  let userToken;
  let admin;
  let user;
  let category;

  beforeAll(async () => {
    // Clean up any existing test data first
    await User.deleteMany({});
    await Category.deleteMany({});
    await Subcategory.deleteMany({});

    // Create test users
    admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
      isAdmin: true
    });
    adminToken = generateToken(admin._id);

    user = await User.create({
      name: 'Test User',
      email: 'user@example.com',
      password: 'password123'
    });
    userToken = generateToken(user._id);

    // Create test category
    category = await Category.create({
      name: 'Electronics',
      slug: 'electronics',
      isActive: true
    });

    // Verify category was created
    if (!category._id) {
      throw new Error('Failed to create test category');
    }
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Category.deleteMany({});
    await Subcategory.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Subcategory.deleteMany({});
    // Make sure category still exists and recreate if needed
    const existingCategory = await Category.findById(category._id);
    if (!existingCategory) {
      category = await Category.create({
        name: 'Electronics',
        slug: 'electronics',
        isActive: true
      });
    }
  });

  describe('POST /api/subcategories', () => {
    it('should create a subcategory when admin', async () => {
      const subcategoryData = {
        name: 'Smartphones',
        category: category._id,
        description: 'Mobile phones and accessories'
      };

      const res = await request(app)
        .post('/api/subcategories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(subcategoryData);

      expect(res.statusCode).toBe(201);
      expect(res.body.name).toBe('Smartphones');
      expect(res.body.slug).toBe('smartphones');
      expect(res.body.category).toBe(category._id.toString());
    });

    it('should not allow regular users to create subcategories', async () => {
      const res = await request(app)
        .post('/api/subcategories')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Smartphones',
          category: category._id
        });

  expect(res.statusCode).toBe(403);
    });

    it('should validate category existence', async () => {
      const res = await request(app)
        .post('/api/subcategories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Smartphones',
          category: mongoose.Types.ObjectId()
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/subcategories', () => {
    beforeEach(async () => {
      // First verify category exists
      const cat = await Category.findById(category._id);
      if (!cat) {
        throw new Error('Test category not found');
      }

      // Create test subcategories with verified category
      await Subcategory.create([
        {
          name: 'Smartphones',
          slug: 'smartphones',
          category: cat._id,
          isActive: true
        },
        {
          name: 'Laptops',
          slug: 'laptops',
          category: cat._id,
          isActive: true
        }
      ]);
    });

    it('should return all active subcategories', async () => {
      const res = await request(app)
        .get('/api/subcategories');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('should filter subcategories by category', async () => {
      const res = await request(app)
        .get('/api/subcategories')
        .query({ category: category._id });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].category._id.toString()).toBe(category._id.toString());
    });
  });

  describe('GET /api/subcategories/:id', () => {
    let subcategory;

    beforeEach(async () => {
      subcategory = await Subcategory.create({
        name: 'Smartphones',
        slug: 'smartphones',
        category: category._id,
        isActive: true
      });
    });

    it('should get subcategory by ID', async () => {
      const res = await request(app)
        .get(`/api/subcategories/${subcategory._id}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('Smartphones');
    });

    it('should return 404 for non-existent subcategory', async () => {
      const res = await request(app)
        .get(`/api/subcategories/${mongoose.Types.ObjectId()}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/subcategories/:id', () => {
    let subcategory;

    beforeEach(async () => {
      subcategory = await Subcategory.create({
        name: 'Smartphones',
        slug: 'smartphones',
        category: category._id,
        isActive: true
      });
    });

    it('should update subcategory when admin', async () => {
      const res = await request(app)
        .put(`/api/subcategories/${subcategory._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Mobile Phones',
          description: 'Updated description'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('Mobile Phones');
      expect(res.body.slug).toBe('mobile-phones');
    });

    it('should not allow regular users to update subcategories', async () => {
      const res = await request(app)
        .put(`/api/subcategories/${subcategory._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Mobile Phones'
        });

  expect(res.statusCode).toBe(403);
    });
  });

  describe('DELETE /api/subcategories/:id', () => {
    let subcategory;

    beforeEach(async () => {
      subcategory = await Subcategory.create({
        name: 'Smartphones',
        slug: 'smartphones',
        category: category._id,
        isActive: true
      });
    });

    it('should delete subcategory when admin', async () => {
      const res = await request(app)
        .delete(`/api/subcategories/${subcategory._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Subcategory removed');
    });

    it('should not allow regular users to delete subcategories', async () => {
      const res = await request(app)
        .delete(`/api/subcategories/${subcategory._id}`)
        .set('Authorization', `Bearer ${userToken}`);

  expect(res.statusCode).toBe(403);
    });
  });
});