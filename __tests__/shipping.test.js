const mongoose = require('mongoose');
const app = require('../index');
const supertest = require('supertest');
const request = (appParam) => global.request || supertest(appParam);
const Shipping = require('../models/shippingModel');
const User = require('../models/userModel');
const { generateToken } = require('../utils/generateToken');

describe('Shipping Controller Tests', () => {
  let adminToken;
  let userToken;
  let admin;
  let user;

  beforeEach(async () => {
    await User.deleteMany({});
    await Shipping.deleteMany({});
    
    const adminId = new mongoose.Types.ObjectId();
    const adminIdStr = adminId.toString().slice(0, -1) + 'a';
    const adminJti = new mongoose.Types.ObjectId().toString();
    
    admin = await User.create({
      _id: adminIdStr,
      name: 'Admin User',
      email: `admin.${adminIdStr}@example.com`,
      password: 'admin123',
      isAdmin: true,
      sessions: [{
        jti: adminJti,
        userAgent: 'test',
        ip: '127.0.0.1',
        lastUsedAt: new Date()
      }]
    });
    adminToken = generateToken(admin._id, { jti: adminJti });

    const userJti = new mongoose.Types.ObjectId().toString();
    user = await User.create({
      _id: new mongoose.Types.ObjectId(),
      name: 'Test User',
      email: `user.${Date.now()}@example.com`,
      password: 'password123',
      sessions: [{
        jti: userJti,
        userAgent: 'test',
        ip: '127.0.0.1',
        lastUsedAt: new Date()
      }]
    });
    userToken = generateToken(user._id, { jti: userJti });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Shipping.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/shipping', () => {
    it('should create a shipping method when admin', async () => {
      const shippingData = {
        name: 'Express Shipping',
        carrier: 'DHL',
        baseRate: 10,
        ratePerKg: 2,
        estimatedDays: '1-2',
        regions: ['USA', 'Canada']
      };

      const res = await request(app)
        .post('/api/shipping')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(shippingData);

      expect(res.statusCode).toBe(201);
      expect(res.body.name).toBe('Express Shipping');
      expect(res.body.carrier).toBe('DHL');
    });

    it('should not allow regular users to create shipping methods', async () => {
      const shippingData = {
        name: 'Express Shipping',
        carrier: 'DHL',
        baseRate: 10
      };

      const res = await request(app)
        .post('/api/shipping')
        .set('Authorization', `Bearer ${userToken}`)
        .send(shippingData);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/shipping', () => {
    beforeEach(async () => {
      await Shipping.create([
        {
          name: 'Standard Shipping',
          carrier: 'USPS',
          baseRate: 5,
          ratePerKg: 1,
          regions: ['USA'],
          isActive: true
        },
        {
          name: 'Express Shipping',
          carrier: 'DHL',
          baseRate: 15,
          ratePerKg: 3,
          regions: ['USA', 'Canada'],
          isActive: true
        }
      ]);
    });

    it('should return all active shipping methods', async () => {
      const res = await request(app)
        .get('/api/shipping');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('should filter shipping methods by region', async () => {
      const res = await request(app)
        .get('/api/shipping')
        .query({ region: 'Canada' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe('Express Shipping');
    });
  });

  describe('PUT /api/shipping/:id', () => {
    let shippingId;

    beforeEach(async () => {
      const shipping = await Shipping.create({
        name: 'Standard Shipping',
        carrier: 'USPS',
        baseRate: 5,
        ratePerKg: 1,
        isActive: true
      });
      shippingId = shipping._id;
    });

    it('should update shipping method when admin', async () => {
      const res = await request(app)
        .put(`/api/shipping/${shippingId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          baseRate: 6,
          ratePerKg: 2
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.baseRate).toBe(6);
      expect(res.body.ratePerKg).toBe(2);
    });

    it('should not allow regular users to update shipping methods', async () => {
      const res = await request(app)
        .put(`/api/shipping/${shippingId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          baseRate: 6
        });

        expect(res.statusCode).toBe(403);
    });
  });

  describe('POST /api/shipping/calculate', () => {
    let shippingMethod;

    beforeEach(async () => {
      shippingMethod = await Shipping.create({
        name: 'Standard Shipping',
        carrier: 'USPS',
        baseRate: 5,
        ratePerKg: 2,
        regions: ['USA'],
        isActive: true
      });
    });

    it('should calculate shipping cost correctly', async () => {
      const res = await request(app)
        .post('/api/shipping/calculate')
        .send({
          methodId: shippingMethod._id,
          weight: 2,
          region: 'USA'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.cost).toBe(9); 
    });

    it('should return 404 for invalid shipping method', async () => {
      const res = await request(app)
        .post('/api/shipping/calculate')
        .send({
          methodId: mongoose.Types.ObjectId(),
          weight: 2,
          region: 'USA'
        });

      expect(res.statusCode).toBe(404);
    });

    it('should validate weight input', async () => {
      const res = await request(app)
        .post('/api/shipping/calculate')
        .send({
          methodId: shippingMethod._id,
          weight: -1,
          region: 'USA'
        });

      expect(res.statusCode).toBe(400);
    });
  });
});