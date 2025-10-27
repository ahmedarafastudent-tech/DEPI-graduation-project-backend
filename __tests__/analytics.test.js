const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../index');
const Analytics = require('../models/analyticsModel');
const User = require('../models/userModel');
const { generateToken } = require('../utils/generateToken');

describe('Analytics Controller Tests', () => {
  let adminToken;
  let userToken;
  let admin;
  let user;

  beforeAll(async () => {
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
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Analytics.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Analytics.deleteMany({});
  });

  describe('POST /api/analytics/event', () => {
    it('should track an event with user ID', async () => {
      const eventData = {
        eventType: 'product_view',
        metadata: {
          productId: mongoose.Types.ObjectId(),
          category: 'Electronics'
        }
      };

      const res = await request(app)
        .post('/api/analytics/event')
        .set('Authorization', `Bearer ${userToken}`)
        .send(eventData);

      expect(res.statusCode).toBe(201);
      expect(res.body.eventType).toBe('product_view');
      expect(res.body.userId.toString()).toBe(user._id.toString());
    });

    it('should track an event without user ID', async () => {
      const eventData = {
        eventType: 'page_view',
        metadata: {
          page: 'home'
        }
      };

      const res = await request(app)
        .post('/api/analytics/event')
        .send(eventData);

      expect(res.statusCode).toBe(201);
      expect(res.body.eventType).toBe('page_view');
      expect(res.body.userId).toBeNull();
    });
  });

  describe('GET /api/analytics', () => {
    beforeEach(async () => {
      const baseDate = new Date();
      await Analytics.create([
        {
          eventType: 'product_view',
          userId: user._id,
          metadata: { productId: mongoose.Types.ObjectId() },
          timestamp: baseDate
        },
        {
          eventType: 'product_view',
          userId: user._id,
          metadata: { productId: mongoose.Types.ObjectId() },
          timestamp: new Date(baseDate.getTime() - 24 * 60 * 60 * 1000)
        },
        {
          eventType: 'purchase',
          userId: user._id,
          metadata: { orderId: mongoose.Types.ObjectId() },
          timestamp: baseDate
        }
      ]);
    });

    it('should get analytics with date range filter', async () => {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);

      const res = await request(app)
        .get('/api/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.events).toHaveLength(3);
      expect(res.body.summary).toBeDefined();
    });

    it('should filter analytics by event type', async () => {
      const res = await request(app)
        .get('/api/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ eventType: 'product_view' });

      expect(res.statusCode).toBe(200);
      expect(res.body.events).toHaveLength(2);
      expect(res.body.events[0].eventType).toBe('product_view');
    });

    it('should not allow non-admin users to access analytics', async () => {
      const res = await request(app)
        .get('/api/analytics')
        .set('Authorization', `Bearer ${userToken}`);

  expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/analytics/user/:userId', () => {
    beforeEach(async () => {
      await Analytics.create([
        {
          eventType: 'product_view',
          userId: user._id,
          metadata: { productId: mongoose.Types.ObjectId() }
        },
        {
          eventType: 'purchase',
          userId: user._id,
          metadata: { orderId: mongoose.Types.ObjectId() }
        }
      ]);
    });

    it('should get user activity', async () => {
      const res = await request(app)
        .get(`/api/analytics/user/${user._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].userId.toString()).toBe(user._id.toString());
    });

    it('should not allow non-admin users to access user activity', async () => {
      const res = await request(app)
        .get(`/api/analytics/user/${user._id}`)
        .set('Authorization', `Bearer ${userToken}`);

  expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/analytics/products', () => {
    beforeEach(async () => {
      const productId = mongoose.Types.ObjectId();
      await Analytics.create([
        {
          eventType: 'product_view',
          userId: user._id,
          metadata: { productId, productName: 'Test Product' },
          timestamp: new Date()
        },
        {
          eventType: 'product_view',
          userId: user._id,
          metadata: { productId, productName: 'Test Product' },
          timestamp: new Date()
        },
        {
          eventType: 'purchase',
          userId: user._id,
          metadata: {
            orderId: mongoose.Types.ObjectId(),
            products: [{
              productId,
              productName: 'Test Product',
              quantity: 1,
              price: 99.99
            }]
          },
          timestamp: new Date()
        }
      ]);
    });

    it('should get product analytics', async () => {
      const res = await request(app)
        .get('/api/analytics/products')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.mostViewed).toBeDefined();
      expect(res.body.mostPurchased).toBeDefined();
      expect(res.body.mostViewed[0].views).toBe(2);
      expect(res.body.mostPurchased[0].purchases).toBe(1);
    });

    it('should not allow non-admin users to access product analytics', async () => {
      const res = await request(app)
        .get('/api/analytics/products')
        .set('Authorization', `Bearer ${userToken}`);

  expect(res.statusCode).toBe(403);
    });
  });
});