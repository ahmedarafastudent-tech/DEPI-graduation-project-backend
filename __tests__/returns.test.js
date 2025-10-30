const mongoose = require('mongoose');
const app = require('../index');
const supertest = require('supertest');
const request = (appParam) => global.request || supertest(appParam);
const Return = require('../models/returnModel');
const Order = require('../models/orderModel');
const User = require('../models/userModel');
const { generateToken } = require('../utils/generateToken');

jest.mock('../utils/sendEmail', () => jest.fn());

describe('Return Controller Tests', () => {
  let adminToken;
  let userToken;
  let admin;
  let user;
  let order;

  beforeAll(async () => {
    const { user: adminUser, token } = await createUserAndToken(app, { isAdmin: true });
    admin = adminUser;
    adminToken = token;

    user = await User.create({
      name: 'Test User',
      email: 'user@example.com',
      password: 'password123'
    });
    userToken = generateToken(user._id);

    order = await Order.create({
      user: user._id,
      orderItems: [
        {
          name: 'Test Product',
          qty: 1,
          image: '/images/test.jpg',
          price: 99.99,
          product: mongoose.Types.ObjectId()
        }
      ],
      shippingAddress: {
        address: '123 Test St',
        city: 'Test City',
        postalCode: '12345',
        country: 'Test Country'
      },
      paymentMethod: 'PayPal',
      totalPrice: 99.99,
      isPaid: true,
      paidAt: Date.now()
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Order.deleteMany({});
    await Return.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Return.deleteMany({});
  });

  describe('POST /api/returns', () => {
    it('should create a return request', async () => {
      const returnData = {
        orderId: order._id,
        items: [{
          product: order.orderItems[0].product,
          quantity: 1,
          reason: 'defective'
        }],
        reason: 'Product is defective',
        description: 'Item arrived damaged'
      };

      const res = await request(app)
        .post('/api/returns')
        .set('Authorization', `Bearer ${userToken}`)
        .send(returnData);

      expect(res.statusCode).toBe(201);
      expect(res.body.order).toBe(order._id.toString());
      expect(res.body.status).toBe('pending');
    });

    it('should not allow return after 30 days', async () => {
      const oldOrder = await Order.create({
        ...order.toObject(),
        createdAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000)
      });

      const returnData = {
        orderId: oldOrder._id,
        items: [{
          product: oldOrder.orderItems[0].product,
          quantity: 1,
          reason: 'defective'
        }],
        reason: 'Product is defective'
      };

      const res = await request(app)
        .post('/api/returns')
        .set('Authorization', `Bearer ${userToken}`)
        .send(returnData);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Return period has expired');
    });
  });

  describe('GET /api/returns', () => {
    beforeEach(async () => {
      await Return.create([
        {
          order: order._id,
          user: user._id,
          items: [{
            product: order.orderItems[0].product,
            quantity: 1,
            reason: 'defective'
          }],
          status: 'pending'
        },
        {
          order: order._id,
          user: user._id,
          items: [{
            product: order.orderItems[0].product,
            quantity: 1,
            reason: 'wrong_item'
          }],
          status: 'approved'
        }
      ]);
    });

    it('should get all returns for admin', async () => {
      const res = await request(app)
        .get('/api/returns')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('should filter returns by status', async () => {
      const res = await request(app)
        .get('/api/returns')
        .query({ status: 'pending' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].status).toBe('pending');
    });
  });

  describe('GET /api/returns/my-returns', () => {
    beforeEach(async () => {
      await Return.create([
        {
          order: order._id,
          user: user._id,
          items: [{
            product: order.orderItems[0].product,
            quantity: 1,
            reason: 'defective'
          }],
          status: 'pending'
        }
      ]);
    });

    it('should get user returns', async () => {
      const res = await request(app)
        .get('/api/returns/my-returns')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].user.toString()).toBe(user._id.toString());
    });
  });

  describe('PUT /api/returns/:id', () => {
    let returnRequest;

    beforeEach(async () => {
      returnRequest = await Return.create({
        order: order._id,
        user: user._id,
        items: [{
          product: order.orderItems[0].product,
          quantity: 1,
          reason: 'defective'
        }],
        status: 'pending'
      });
    });

    it('should update return status when admin', async () => {
      const res = await request(app)
        .put(`/api/returns/${returnRequest._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'approved',
          adminNotes: 'Approved for return'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('approved');
      expect(res.body.adminNotes).toBe('Approved for return');
    });

    it('should not allow regular users to update return status', async () => {
      const res = await request(app)
        .put(`/api/returns/${returnRequest._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          status: 'approved'
        });

  expect(res.statusCode).toBe(403);
    });
  });
});