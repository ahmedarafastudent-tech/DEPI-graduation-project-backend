const mongoose = require('mongoose');
const app = require('../index');
const supertest = require('supertest');
const request = (appParam) => global.request || supertest(appParam);
const Newsletter = require('../models/newsletterModel');
const User = require('../models/userModel');
const { generateToken } = require('../utils/generateToken');

jest.mock('../utils/sendEmail', () => jest.fn());

describe('Newsletter Controller Tests', () => {
  let adminToken;
  let admin;

  beforeAll(async () => {
    admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
      isAdmin: true
    });
    adminToken = generateToken(admin._id);
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Newsletter.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Newsletter.deleteMany({});
  });

  describe('POST /api/newsletter/subscribe', () => {
    it('should subscribe a new email', async () => {
      const res = await request(app)
        .post('/api/newsletter/subscribe')
        .send({
          email: 'subscriber@example.com',
          preferences: {
            promotions: true,
            news: true,
            productUpdates: false
          }
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.subscriber.email).toBe('subscriber@example.com');
      expect(res.body.subscriber.preferences).toContain('promotions');
      expect(res.body.subscriber.preferences).toContain('news');
    });

    it('should not allow duplicate subscriptions', async () => {
      await Newsletter.create({
        email: 'subscriber@example.com',
        preferences: ['promotions'],
        isSubscribed: true
      });

      const res = await request(app)
        .post('/api/newsletter/subscribe')
        .send({
          email: 'subscriber@example.com',
          preferences: ['news']
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/newsletter/unsubscribe', () => {
    beforeEach(async () => {
      await Newsletter.create({
        email: 'subscriber@example.com',
        preferences: ['promotions'],
        isSubscribed: true
      });
    });

    it('should unsubscribe an email', async () => {
      const res = await request(app)
        .post('/api/newsletter/unsubscribe')
        .send({
          email: 'subscriber@example.com'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.subscriber.isSubscribed).toBe(false);
    });

    it('should handle unsubscribe for non-existent email', async () => {
      const res = await request(app)
        .post('/api/newsletter/unsubscribe')
        .send({
          email: 'nonexistent@example.com'
        });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/newsletter/preferences', () => {
    beforeEach(async () => {
      await Newsletter.create({
        email: 'subscriber@example.com',
        preferences: ['promotions'],
        isSubscribed: true
      });
    });

    it('should update subscriber preferences', async () => {
      const res = await request(app)
        .put('/api/newsletter/preferences')
        .send({
          email: 'subscriber@example.com',
          preferences: ['news', 'updates']
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.subscriber.preferences).toContain('news');
      expect(res.body.subscriber.preferences).toContain('updates');
      expect(res.body.subscriber.preferences).not.toContain('promotions');
    });

    it('should handle update for non-existent email', async () => {
      const res = await request(app)
        .put('/api/newsletter/preferences')
        .send({
          email: 'nonexistent@example.com',
          preferences: ['news']
        });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /api/newsletter/subscribers', () => {
    beforeEach(async () => {
      await Newsletter.create({
        email: 'subscriber1@example.com',
        preferences: ['promotions'],
        isSubscribed: true
      });
      await Newsletter.create({
        email: 'subscriber2@example.com',
        preferences: ['news'],
        isSubscribed: true
      });
    });

    it('should return all subscribers for admin', async () => {
      const res = await request(app)
        .get('/api/newsletter/subscribers')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('should not allow access without admin privileges', async () => {
      const userToken = generateToken(mongoose.Types.ObjectId());
      const res = await request(app)
        .get('/api/newsletter/subscribers')
        .set('Authorization', `Bearer ${userToken}`);

  expect(res.statusCode).toBe(403);
    });
  });

  describe('POST /api/newsletter/send', () => {
    beforeEach(async () => {
      await Newsletter.create([
        {
          email: 'subscriber1@example.com',
          preferences: ['promotions'],
          isSubscribed: true
        },
        {
          email: 'subscriber2@example.com',
          preferences: ['news'],
          isSubscribed: true
        }
      ]);
    });

    it('should send newsletter to subscribers', async () => {
      const res = await request(app)
        .post('/api/newsletter/send')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          subject: 'Test Newsletter',
          content: 'Newsletter content',
          preferences: ['promotions']
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.recipientCount).toBe(1);
    });

    it('should not allow sending without admin privileges', async () => {
      const userToken = generateToken(mongoose.Types.ObjectId());
      const res = await request(app)
        .post('/api/newsletter/send')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          subject: 'Test Newsletter',
          content: 'Newsletter content'
        });

  expect(res.statusCode).toBe(403);
    });
  });
});