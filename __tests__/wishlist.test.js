const mongoose = require('mongoose');
const app = require('../index');
const supertest = require('supertest');
const request = (appParam) => global.request || supertest(appParam);
const Wishlist = require('../models/wishlistModel');
const Product = require('../models/productModel');
const User = require('../models/userModel');
const { generateToken } = require('../utils/generateToken');

describe('Wishlist Controller Tests', () => {
  let token;
  let user;
  let product;

  let seller;

  beforeAll(async () => {
    user = await User.create({
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'password123',
      isAdmin: false
    });
    token = generateToken(user._id);

    seller = await User.create({
      name: 'Test Seller',
      email: 'seller@example.com',
      password: 'password123',
      isAdmin: false
    });

    await Wishlist.deleteMany({});
    await Product.deleteMany({});
  });

  beforeEach(async () => {
    await Wishlist.deleteMany({});

    product = await Product.create({
      name: 'Test Product',
      description: 'Test Description',
      price: 99.99,
      seller: seller._id,
      category: 'Test Category',
      countInStock: 10,
      rating: 0,
      numReviews: 0,
      variants: [{
        sku: 'TEST-123',
        attributes: new Map([['color', 'blue']]),
        price: 99.99,
        countInStock: 10
      }]
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Product.deleteMany({});
    await Wishlist.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Wishlist.deleteMany({});
  });

  describe('GET /api/wishlist', () => {
    it('should get empty wishlist for new user', async () => {
      const res = await request(app)
        .get('/api/wishlist')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.items).toHaveLength(0);
    });

    it('should return existing wishlist items', async () => {
      await Wishlist.create({
        user: user._id,
        items: [{ product: product._id }],
      });

      const res = await request(app)
        .get('/api/wishlist')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].product._id.toString()).toBe(
        product._id.toString()
      );
    });
  });

  describe('POST /api/wishlist', () => {
    it('should add item to wishlist', async () => {
      const res = await request(app)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: product._id });

      expect(res.statusCode).toBe(200);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].product._id.toString()).toBe(
        product._id.toString()
      );
    });

    it('should not add duplicate items', async () => {
      await request(app)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: product._id });

      const res = await request(app)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: product._id });

      expect(res.statusCode).toBe(200);
      expect(res.body.items).toHaveLength(1);
    });
  });

  describe('DELETE /api/wishlist/:productId', () => {
    it('should remove item from wishlist', async () => {
      await Wishlist.create({
        user: user._id,
        items: [{ product: product._id }],
      });

      const res = await request(app)
        .delete(`/api/wishlist/${product._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.items).toHaveLength(0);
    });

    it('should return 404 for non-existent wishlist', async () => {
      const res = await request(app)
        .delete(`/api/wishlist/${product._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/wishlist/:productId/move-to-cart', () => {
    it('should move item from wishlist to cart', async () => {
      await Wishlist.create({
        user: user._id,
        items: [{ product: product._id }],
      });

      const res = await request(app)
        .post(`/api/wishlist/${product._id}/move-to-cart`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.wishlist.items).toHaveLength(0);
      expect(res.body.cart.items).toHaveLength(1);
      expect(res.body.cart.items[0].product.toString()).toBe(
        product._id.toString()
      );
    });
  });
});
