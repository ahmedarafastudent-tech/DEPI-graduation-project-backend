const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../index');
const Order = require('../models/orderModel');

// Force test environment
process.env.NODE_ENV = 'test';

const mockPaytabs = require('../config/paytabs');

describe('Payment Controller Tests', () => {
  let mongoServer;
  let user;
  let testOrder;

  beforeAll(async () => {
    // Clear any existing MongoDB connections
    await mongoose.disconnect();

    // Create in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connect to the in-memory database
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Create test user
    const createUserResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!'
      });

    user = createUserResponse.body;

    // Create test order
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
      totalPrice: 99.99,
      status: 'pending'
    });

    // Clear any existing mock implementations
    jest.clearAllMocks();
  });

  afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      if (collection.collectionName !== 'users') {
        await collection.deleteMany();
      }
    }
    jest.clearAllMocks();
  });

  describe('POST /api/payments/verify-payment', () => {
    it('should handle failed payment verification', async () => {
      // Setup mock for failed verification
      mockPaytabs.instance.verifyPayment = jest.fn().mockResolvedValueOnce({
        data: {
          response_status: 'D',
          cart_amount: '99.99'
        }
      });

      // Make the test request
      const res = await request(app)
        .post('/api/payments/verify-payment')
        .send({
          tran_ref: 'test_transaction_ref',
          orderId: testOrder._id.toString()
        });

      // Log response for debugging
      console.log('Test Response:', {
        status: res.status,
        body: res.body,
        headers: res.headers
      });

      // Assertions
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Payment verification failed');
      expect(mockPaytabs.instance.verifyPayment).toHaveBeenCalledWith({
        tran_ref: 'test_transaction_ref',
        cart_id: testOrder._id.toString()
      });
    });
  });
});