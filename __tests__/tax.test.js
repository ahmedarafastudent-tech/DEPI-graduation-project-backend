const mongoose = require('mongoose');
const app = require('../index');
const supertest = require('supertest');
const request = (appParam) => global.request || supertest(appParam);
const Tax = require('../models/taxModel');
const User = require('../models/userModel');
const { generateToken } = require('../utils/generateToken');

describe('Tax Controller Tests', () => {
  let adminToken;
  let userToken;
  let admin;
  let user;

  beforeAll(async () => {
    const { user: adminUser, token } = await createUserAndToken(app, { isAdmin: true });
    admin = adminUser;
    adminToken = token;

    const { user: regularUser, token: regToken } = await createUserAndToken(app, { isAdmin: false });
    user = regularUser;
    userToken = regToken;
    userToken = generateToken(user._id);
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Tax.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Tax.deleteMany({});
  });

  describe('POST /api/tax', () => {
    it('should create a tax rate when admin', async () => {
      const taxData = {
        name: 'US Sales Tax',
        rate: 8.5,
        region: 'USA',
        type: 'percentage',
        isDefault: true
      };

      const res = await request(app)
        .post('/api/tax')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(taxData);

      expect(res.statusCode).toBe(201);
      expect(res.body.name).toBe('US Sales Tax');
      expect(res.body.rate).toBe(8.5);
      expect(res.body.isDefault).toBe(true);
    });

    it('should handle multiple default tax rates for same region', async () => {
      await Tax.create({
        name: 'US Sales Tax 1',
        rate: 8.5,
        region: 'USA',
        type: 'percentage',
        isDefault: true
      });

      const res = await request(app)
        .post('/api/tax')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'US Sales Tax 2',
          rate: 9,
          region: 'USA',
          type: 'percentage',
          isDefault: true
        });

      expect(res.statusCode).toBe(201);

      const oldTax = await Tax.findOne({ name: 'US Sales Tax 1' });
      expect(oldTax.isDefault).toBe(false);
    });

    it('should not allow regular users to create tax rates', async () => {
      const res = await request(app)
        .post('/api/tax')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'US Sales Tax',
          rate: 8.5
        });

  expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/tax', () => {
    beforeEach(async () => {
      await Tax.create([
        {
          name: 'US Sales Tax',
          rate: 8.5,
          region: 'USA',
          type: 'percentage',
          isActive: true
        },
        {
          name: 'CA Sales Tax',
          rate: 13,
          region: 'Canada',
          type: 'percentage',
          isActive: true
        }
      ]);
    });

    it('should return all active tax rates', async () => {
      const res = await request(app)
        .get('/api/tax')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('should filter tax rates by region', async () => {
      const res = await request(app)
        .get('/api/tax')
        .query({ region: 'USA' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe('US Sales Tax');
    });
  });

  describe('PUT /api/tax/:id', () => {
    let taxId;

    beforeEach(async () => {
      const tax = await Tax.create({
        name: 'US Sales Tax',
        rate: 8.5,
        region: 'USA',
        type: 'percentage',
        isActive: true
      });
      taxId = tax._id;
    });

    it('should update tax rate when admin', async () => {
      const res = await request(app)
        .put(`/api/tax/${taxId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          rate: 9,
          isDefault: true
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.rate).toBe(9);
      expect(res.body.isDefault).toBe(true);
    });

    it('should not allow regular users to update tax rates', async () => {
      const res = await request(app)
        .put(`/api/tax/${taxId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          rate: 9
        });

  expect(res.statusCode).toBe(403);
    });
  });

  describe('POST /api/tax/calculate', () => {
    beforeEach(async () => {
      await Tax.create({
        name: 'US Sales Tax',
        rate: 10,
        region: 'USA',
        type: 'percentage',
        threshold: 100,
        isDefault: true,
        isActive: true
      });
    });

    it('should calculate percentage tax correctly', async () => {
      const res = await request(app)
        .post('/api/tax/calculate')
        .send({
          region: 'USA',
          subtotal: 200
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.taxAmount).toBe(20); 
      expect(res.body.total).toBe(220);
    });

    it('should apply threshold correctly', async () => {
      const res = await request(app)
        .post('/api/tax/calculate')
        .send({
          region: 'USA',
          subtotal: 50
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.taxAmount).toBe(0);
      expect(res.body.total).toBe(50);
    });

    it('should handle missing tax rate for region', async () => {
      const res = await request(app)
        .post('/api/tax/calculate')
        .send({
          region: 'Unknown',
          subtotal: 100
        });

      expect(res.statusCode).toBe(404);
    });
  });
});