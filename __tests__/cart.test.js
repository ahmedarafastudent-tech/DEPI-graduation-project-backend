const app = require('../index');
const supertest = require('supertest');
const request = (appParam) => global.request || supertest(appParam);
const Cart = require('../models/cartModel');
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

describe('Cart Endpoints', () => {
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

  describe('GET /api/cart', () => {
    it('should get empty cart for new user', async () => {
      const res = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.items).toHaveLength(0);
      expect(res.body.totalPrice).toBe(0);
    });

    it('should get cart with items', async () => {
      await Cart.create({
        user: user._id,
        items: [
          {
            product: product._id,
            name: product.name,
            qty: 2,
            price: product.price,
          },
        ],
        totalPrice: product.price * 2,
      });

      const res = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.totalPrice).toBe(199.98); 
    });
  });

  describe('POST /api/cart', () => {
    it('should add item to cart', async () => {
      const res = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${token}`)
        .send({
          product: product._id,
          qty: 2,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].qty).toBe(2);
      expect(res.body.totalPrice).toBe(199.98);
    });

    it('should update existing item quantity', async () => {
      await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${token}`)
        .send({
          product: product._id,
          qty: 2,
        });

      const res = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${token}`)
        .send({
          product: product._id,
          qty: 3,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].qty).toBe(3);
      expect(res.body.totalPrice).toBe(299.97);
    });
  });

  describe('PUT /api/cart/item/:productId', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${token}`)
        .send({
          product: product._id,
          qty: 2,
        });
    });

    it('should update item quantity', async () => {
      const res = await request(app)
        .put(`/api/cart/item/${product._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ qty: 4 });

      expect(res.statusCode).toBe(200);
      expect(res.body.items[0].qty).toBe(4);
      expect(res.body.totalPrice).toBe(399.96);
    });
  });

  describe('DELETE /api/cart/item/:productId', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${token}`)
        .send({
          product: product._id,
          qty: 2,
        });
    });

    it('should remove item from cart', async () => {
      const res = await request(app)
        .delete(`/api/cart/item/${product._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.items).toHaveLength(0);
      expect(res.body.totalPrice).toBe(0);
    });
  });

  describe('DELETE /api/cart', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${token}`)
        .send({
          product: product._id,
          qty: 2,
        });
    });

    it('should clear cart', async () => {
      const res = await request(app)
        .delete('/api/cart')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Cart cleared');

      const cart = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${token}`);

      expect(cart.body.items).toHaveLength(0);
      expect(cart.body.totalPrice).toBe(0);
    });
  });
});
