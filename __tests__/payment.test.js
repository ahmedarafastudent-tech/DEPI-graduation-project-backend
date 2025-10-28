// Single, consolidated payment tests that mock paytabs instance methods per-test.
process.env.NODE_ENV = 'test';

const mongoose = require('mongoose');
const app = require('../index');
const supertest = require('supertest');
const request = (appParam) => global.request || supertest(appParam);
const Order = require('../models/orderModel');
const User = require('../models/userModel');
const { generateToken } = require('../utils/generateToken');
const paytabs = require('../config/paytabs');

describe('Payment Controller Tests', () => {
  let user;
  let otherUser;
  let userToken;

  beforeAll(async () => {
    user = await User.create({ name: 'Test User', email: 'user@test.com', password: 'Password123!' });
    otherUser = await User.create({ name: 'Other User', email: 'other@test.com', password: 'Password123!' });
    userToken = generateToken(user._id);
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Order.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/payments/create-payment', () => {
    let testOrder;

    beforeEach(async () => {
      await Order.deleteMany({});
      testOrder = await Order.create({
        user: user._id,
        orderItems: [{ name: 'Test Product', qty: 1, image: '/img.jpg', price: 99.99, product: new mongoose.Types.ObjectId() }],
        shippingAddress: { address: 'Addr', city: 'City', postalCode: '00000', country: 'Country' },
        paymentMethod: 'paytabs',
        totalPrice: 99.99
      });
    });

    it('should create a payment page', async () => {
      paytabs.instance.createPaymentPage = jest.fn().mockResolvedValueOnce({ tran_ref: 'test_transaction_ref', payment_url: 'https://pay.test' });

      const res = await request(app)
        .post('/api/payments/create-payment')
        .set('Authorization', `Bearer ${userToken}`)
  .send({ orderId: testOrder._id.toString(), returnUrl: 'http://localhost:3000/success' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('payment_url');
      expect(res.body).toHaveProperty('tran_ref');
      expect(paytabs.instance.createPaymentPage).toHaveBeenCalled();
    });

    it('should validate order existence', async () => {
      const res = await request(app)
        .post('/api/payments/create-payment')
        .set('Authorization', `Bearer ${userToken}`)
  .send({ orderId: new mongoose.Types.ObjectId().toString(), returnUrl: 'http://localhost:3000/success' });

      expect(res.status).toBe(404);
    });

    it('should validate order ownership', async () => {
      const userOrder = await Order.create({
        user: user._id,
        orderItems: [{ name: 'P', qty: 1, image: '/i', price: 99.99, product: new mongoose.Types.ObjectId() }],
        shippingAddress: { address: 'a', city: 'b', postalCode: 'c', country: 'd' },
        paymentMethod: 'paytabs', totalPrice: 99.99
      });

      const otherToken = generateToken(otherUser._id);
      const res = await request(app)
        .post('/api/payments/create-payment')
        .set('Authorization', `Bearer ${otherToken}`)
  .send({ orderId: userOrder._id.toString(), returnUrl: 'http://localhost:3000/success' });

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/payments/verify-payment', () => {
    let testOrder;

    beforeEach(async () => {
      await Order.deleteMany({});
      testOrder = await Order.create({
        user: user._id,
        orderItems: [{ name: 'Test Product', qty: 1, image: '/img.jpg', price: 99.99, product: new mongoose.Types.ObjectId() }],
        shippingAddress: { address: 'Addr', city: 'City', postalCode: '00000', country: 'Country' },
        paymentMethod: 'paytabs',
        totalPrice: 99.99
      });
    });

    it('should verify successful payment', async () => {
      paytabs.instance.verifyPayment = jest.fn().mockResolvedValueOnce({ data: { response_status: 'A', tran_ref: 'test_transaction_ref', cart_amount: '99.99' } });

      const res = await request(app)
        .post('/api/payments/verify-payment')
        .send({ tran_ref: 'test_transaction_ref', orderId: testOrder._id.toString() });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true });

      const updatedOrder = await Order.findById(testOrder._id);
      expect(updatedOrder.isPaid).toBe(true);
      expect(updatedOrder.paymentResult).toHaveProperty('tran_ref', 'test_transaction_ref');
    });

    it('should handle failed payment verification', async () => {
      paytabs.instance.verifyPayment = jest.fn().mockResolvedValueOnce({ data: { response_status: 'D', cart_amount: '99.99' } });

      const res = await request(app)
        .post('/api/payments/verify-payment')
        .send({ tran_ref: 'test_transaction_ref', orderId: testOrder._id.toString() });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Payment verification failed');
    });

    it('should validate order existence', async () => {
      const res = await request(app)
        .post('/api/payments/verify-payment')
        .send({ tran_ref: 'test_transaction_ref', orderId: new mongoose.Types.ObjectId().toString() });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message', 'Order not found');
    });

    it('should require tran_ref and orderId', async () => {
      const res = await request(app).post('/api/payments/verify-payment').send({});
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'tran_ref and orderId are required');
    });
  });

  describe('POST /api/payments/refund', () => {
    let paidOrder;

    beforeEach(async () => {
      await Order.deleteMany({});
      paidOrder = await Order.create({
        user: user._id,
        orderItems: [{ name: 'Test Product', qty: 1, image: '/img.jpg', price: 99.99, product: new mongoose.Types.ObjectId() }],
        shippingAddress: { address: 'Addr', city: 'City', postalCode: '00000', country: 'Country' },
        paymentMethod: 'paytabs',
        totalPrice: 99.99,
        isPaid: true,
        paymentResult: { tran_ref: 'test_transaction_ref', response_status: 'A' }
      });
    });

    it('should process refund successfully', async () => {
      paytabs.instance.refundPayment = jest.fn().mockResolvedValueOnce({ data: { response_status: 'A', tran_ref: 'test_transaction_ref' } });

      const res = await request(app)
        .post('/api/payments/refund')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ orderId: paidOrder._id.toString(), refundAmount: 99.99, reason: 'Customer requested refund' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });

    it('should not allow refund for unpaid order', async () => {
      const unpaidOrder = await Order.create({ user: user._id, orderItems: [{ name: 'P', qty: 1, image: '/i', price: 99.99, product: new mongoose.Types.ObjectId() }], shippingAddress: { address: 'a', city: 'b', postalCode: 'c', country: 'd' }, paymentMethod: 'paytabs', totalPrice: 99.99, isPaid: false });

      const res = await request(app)
        .post('/api/payments/refund')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ orderId: unpaidOrder._id.toString(), refundAmount: 99.99, reason: 'Customer requested refund' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Order is not paid/);
    });
  });

  describe('POST /api/payments/ipn', () => {
    let testOrder;

    beforeEach(async () => {
      await Order.deleteMany({});
      testOrder = await Order.create({ user: user._id, orderItems: [{ name: 'P', qty: 1, image: '/i', price: 99.99, product: new mongoose.Types.ObjectId() }], shippingAddress: { address: 'a', city: 'b', postalCode: 'c', country: 'd' }, paymentMethod: 'paytabs', totalPrice: 99.99 });
    });

    it('should handle IPN notification', async () => {
      const res = await request(app)
        .post('/api/payments/ipn')
        .send({ tran_ref: 'test_transaction_ref', cart_id: testOrder._id.toString(), response_status: 'A', cart_amount: '99.99' });

      expect(res.status).toBe(200);
    });

    it('should handle invalid IPN notification', async () => {
      const res = await request(app)
        .post('/api/payments/ipn')
        .send({ tran_ref: 'invalid_ref', cart_id: testOrder._id.toString(), response_status: 'D' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/payments/config', () => {
    it('should return PayTabs configuration', async () => {
      const res = await request(app).get('/api/payments/config');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('profile_id');
      expect(res.body).toHaveProperty('region');
      expect(res.body).toHaveProperty('server_key');
    });
  });
});