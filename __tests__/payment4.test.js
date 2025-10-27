// Force test environment for PayTabs mocks
process.env.NODE_ENV = 'test';

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const Order = require('../models/orderModel');
const User = require('../models/userModel');
const { generateToken } = require('../utils/generateToken');
const paytabs = require('../config/paytabs');

describe('Payment Controller Tests', () => {
  let userToken;
  let user;
  let testOrder;

  beforeAll(async () => {
    // Create test user
    user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!'
    });

    userToken = generateToken(user._id);
  });

  beforeEach(async () => {
    // Clear all existing test orders
    await Order.deleteMany({});

    // Create a test order for each test
    testOrder = await Order.create({
      user: user._id,
      orderItems: [
        {
          name: 'Test Item',
          qty: 1,
          price: 99.99,
          product: new mongoose.Types.ObjectId()
        }
      ],
      shippingAddress: {
        address: 'Test Street',
        city: 'Test City',
        postalCode: '12345',
        country: 'Test Country'
      },
      paymentMethod: 'PayTabs',
      totalPrice: 99.99,
      status: 'pending'
    });

    // Clear any existing mock implementations
    jest.clearAllMocks();
  });

  describe('POST /api/payments/verify-payment', () => {
    it('should handle successful payment verification', async () => {
      // Setup mock for successful verification
      paytabs.instance.verifyPayment = jest.fn().mockResolvedValueOnce({
        data: {
          response_status: 'A',
          cart_amount: '99.99'
        }
      });

      const res = await request(app)
        .post('/api/payments/verify-payment')
        .send({
          tran_ref: 'test_transaction_ref',
          orderId: testOrder._id.toString()
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true });

      // Verify the mock was called correctly
      expect(paytabs.instance.verifyPayment).toHaveBeenCalledWith({
        tran_ref: 'test_transaction_ref',
        cart_id: testOrder._id.toString()
      });

      // Verify order was updated
      const updatedOrder = await Order.findById(testOrder._id);
      expect(updatedOrder.isPaid).toBe(true);
      expect(updatedOrder.paymentResult).toHaveProperty('tran_ref', 'test_transaction_ref');
    });

    it('should handle failed payment verification', async () => {
      // Setup mock for failed verification
      paytabs.instance.verifyPayment = jest.fn().mockResolvedValueOnce({
        data: {
          response_status: 'D',
          cart_amount: '99.99'
        }
      });

      const res = await request(app)
        .post('/api/payments/verify-payment')
        .send({
          tran_ref: 'test_transaction_ref',
          orderId: testOrder._id.toString()
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Payment verification failed');

      // Verify the mock was called correctly
      expect(paytabs.instance.verifyPayment).toHaveBeenCalledWith({
        tran_ref: 'test_transaction_ref',
        cart_id: testOrder._id.toString()
      });

      // Verify order was not marked as paid
      const updatedOrder = await Order.findById(testOrder._id);
      expect(updatedOrder.isPaid).toBeFalsy();
    });

    it('should validate order existence', async () => {
      const res = await request(app)
        .post('/api/payments/verify-payment')
        .send({
          tran_ref: 'test_transaction_ref',
          orderId: new mongoose.Types.ObjectId().toString()
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Order not found');
    });

    it('should require tran_ref and orderId', async () => {
      const res = await request(app)
        .post('/api/payments/verify-payment')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('tran_ref and orderId are required');
    });
  });
});