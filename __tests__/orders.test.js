const app = require('../index');
const supertest = require('supertest');
const request = (appParam) => global.request || supertest(appParam);
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const User = require('../models/userModel');

async function createTestUser(isAdmin = false) {
  const user = await User.create({
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    password: 'Test123',
    isAdmin,
  });
  const token = user.generateToken();
  return { user, token };
}

describe('Order Endpoints', () => {
  let token, user, product;

  beforeEach(async () => {
    const response = await createTestUser();
    token = response.token;
    user = response.user;

    const seller = await createTestUser();
    product = await Product.create({
      name: 'Test Product',
      description: 'Test Description',
      price: 99.99,
      countInStock: 10,
      seller: seller.user._id,
    });
  });

  describe('POST /api/orders', () => {
    it('should create a new order', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderItems: [
            {
              product: product._id,
              qty: 2,
            },
          ],
          shippingAddress: {
            address: '123 Test St',
            city: 'Test City',
            postalCode: '12345',
            country: 'Test Country',
          },
          paymentMethod: 'PayPal',
          totalPrice: 199.98,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.user).toBe(user._id.toString());
      expect(res.body.orderItems).toHaveLength(1);
      expect(res.body.totalPrice).toBe(199.98);
    });

    it('should not create order with invalid product', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderItems: [
            {
              product: '507f1f77bcf86cd799439011', 
              qty: 2,
            },
          ],
          shippingAddress: {
            address: '123 Test St',
            city: 'Test City',
            postalCode: '12345',
            country: 'Test Country',
          },
          paymentMethod: 'PayPal',
          totalPrice: 199.98,
        });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /api/orders/myorders', () => {
    beforeEach(async () => {
      await Order.create([
        {
          user: user._id,
          orderItems: [
            {
              product: product._id,
              name: product.name,
              qty: 2,
              price: product.price,
            },
          ],
          shippingAddress: {
            address: '123 Test St',
            city: 'Test City',
            postalCode: '12345',
            country: 'Test Country',
          },
          paymentMethod: 'PayPal',
          totalPrice: 199.98,
        },
        {
          user: user._id,
          orderItems: [
            {
              product: product._id,
              name: product.name,
              qty: 1,
              price: product.price,
            },
          ],
          shippingAddress: {
            address: '123 Test St',
            city: 'Test City',
            postalCode: '12345',
            country: 'Test Country',
          },
          paymentMethod: 'PayPal',
          totalPrice: 99.99,
        },
      ]);
    });

    it('should get all orders for user', async () => {
      const userOrders = await Order.find({ user: user._id });
      expect(userOrders).toHaveLength(2);
      
      const res = await request(app)
        .get('/api/orders/myorders')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(2);
    });
  });

  describe('GET /api/orders/:id', () => {
    let order;

    beforeEach(async () => {
      order = await Order.create({
        user: user._id,
        orderItems: [
          {
            product: product._id,
            name: product.name,
            qty: 2,
            price: product.price,
          },
        ],
        shippingAddress: {
          address: '123 Test St',
          city: 'Test City',
          postalCode: '12345',
          country: 'Test Country',
        },
        paymentMethod: 'PayPal',
        totalPrice: 199.98,
      });
    });

    it('should get order by id', async () => {
      const res = await request(app)
        .get(`/api/orders/${order._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body._id).toBe(order._id.toString());
      expect(res.body.totalPrice).toBe(199.98);
    });

    it('should not get order of another user', async () => {
      const otherUser = await createTestUser();

      const res = await request(app)
        .get(`/api/orders/${order._id}`)
        .set('Authorization', `Bearer ${otherUser.token}`);

      expect(res.statusCode).toBe(403);
    });
  });
});
