const mongoose = require('mongoose');
const app = require('../index');
const supertest = require('supertest');
const request = (appParam) => global.request || supertest(appParam);
const Coupon = require('../models/couponModel');
const User = require('../models/userModel');
const { generateToken } = require('../utils/generateToken');

describe('Coupon Controller Tests', () => {
  let adminToken;
  let userToken;
  let admin;
  let user;

  beforeAll(async () => {
    // ensure clean collections to avoid duplicate _id issues between suites
    await User.deleteMany({});
    await Coupon.deleteMany({});
    const { user: adminUser, token } = await createUserAndToken(app, { isAdmin: true });
    admin = adminUser;
    adminToken = token;

    user = await User.create({
      name: 'Regular User',
      email: 'user@example.com',
      password: 'User@123Password',
      isVerified: true
    });
    userToken = generateToken(user._id);
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Coupon.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Coupon.deleteMany({});
  });

  describe('POST /api/coupons', () => {
    it('should create a new coupon when admin', async () => {
      const couponData = {
        code: 'TEST20',
        type: 'percentage',
        value: 20,
        minPurchase: 100,
        maxDiscount: 50,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        maxUses: 100
      };

      const res = await request(app)
        .post('/api/coupons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(couponData);

      expect(res.statusCode).toBe(201);
      expect(res.body.code).toBe('TEST20');
      expect(res.body.value).toBe(20);
    });

    it('should not allow regular users to create coupons', async () => {
      const couponData = {
        code: 'TEST20',
        type: 'percentage',
        value: 20,
        minPurchase: 100,
        maxDiscount: 50,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxUses: 100
      };

      const res = await request(app)
        .post('/api/coupons')
        .set('Authorization', `Bearer ${userToken}`)
        .send(couponData);

  expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/coupons', () => {
    beforeEach(async () => {
      await Coupon.create({
        code: 'TEST10',
        type: 'percentage',
        value: 10,
        isActive: true
      });
      await Coupon.create({
        code: 'TEST20',
        type: 'percentage',
        value: 20,
        isActive: true
      });
    });

    it('should return all coupons for admin', async () => {
      const res = await request(app)
        .get('/api/coupons')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(2);
    });
  });

  describe('POST /api/coupons/validate', () => {
    let validCoupon;

    beforeEach(async () => {
      validCoupon = await Coupon.create({
        code: 'VALID20',
        type: 'percentage',
        value: 20,
        minimumPurchase: 100,
        maxDiscount: 50,
        validFrom: new Date(Date.now() - 24 * 60 * 60 * 1000),
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isActive: true
      });
    });

    it('should validate a valid coupon', async () => {
      const res = await request(app)
        .post('/api/coupons/validate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          code: 'VALID20',
          cartTotal: 200
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.valid).toBe(true);
      expect(res.body.coupon.discountAmount).toBe(40); 
      expect(res.body.coupon.finalTotal).toBe(160);
    });

    it('should reject invalid coupon code', async () => {
      const res = await request(app)
        .post('/api/coupons/validate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          code: 'INVALID',
          cartTotal: 200
        });

      expect(res.statusCode).toBe(404);
    });

    it('should reject when cart total is below minimum purchase', async () => {
      const res = await request(app)
        .post('/api/coupons/validate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          code: 'VALID20',
          cartTotal: 50 
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('PUT /api/coupons/:id', () => {
    let couponId;

    beforeEach(async () => {
      const coupon = await Coupon.create({
        code: 'UPDATE20',
        type: 'percentage',
        value: 20,
        isActive: true
      });
      couponId = coupon._id;
    });

    it('should update coupon when admin', async () => {
      const res = await request(app)
        .put(`/api/coupons/${couponId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          value: 25,
          code: 'UPDATE25'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.value).toBe(25);
      expect(res.body.code).toBe('UPDATE25');
    });

    it('should not allow regular users to update coupons', async () => {
      const res = await request(app)
        .put(`/api/coupons/${couponId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          value: 25
        });

  expect(res.statusCode).toBe(403);
    });
  });

  describe('DELETE /api/coupons/:id', () => {
    let couponId;

    beforeEach(async () => {
      const coupon = await Coupon.create({
        code: 'DELETE20',
        type: 'percentage',
        value: 20,
        isActive: true
      });
      couponId = coupon._id;
    });

    it('should delete coupon when admin', async () => {
      const res = await request(app)
        .delete(`/api/coupons/${couponId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      
      const couponExists = await Coupon.findById(couponId);
      expect(couponExists).toBeNull();
    });

    it('should not allow regular users to delete coupons', async () => {
      const res = await request(app)
        .delete(`/api/coupons/${couponId}`)
        .set('Authorization', `Bearer ${userToken}`);

  expect(res.statusCode).toBe(403);
    });
  });
});