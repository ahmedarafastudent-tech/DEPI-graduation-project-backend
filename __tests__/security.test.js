const request = require('supertest');
const app = require('../index');

describe('Security Features', () => {
  describe('Rate Limiting', () => {
    beforeAll(() => {
      // Reset rate limiter before tests
      jest.setTimeout(30000); // Increase timeout for rate limit tests
    });

    it('should limit repeated requests', async () => {
      const requests = Array(50).fill().map(() => 
        request(app).get('/api/products')
      );
      
      await Promise.all(requests);

      const res = await request(app).get('/api/products');
      expect(res.statusCode).toBe(429);
    });
  });

  describe('Headers Security', () => {
    it('should include security headers', async () => {
      const res = await request(app).get('/api/products');

      expect(res.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(res.headers).toHaveProperty('x-frame-options', 'SAMEORIGIN');
      expect(res.headers).toHaveProperty('x-xss-protection', '1; mode=block');
    });
  });

  describe('CORS', () => {
    it('should allow CORS requests', async () => {
      const res = await request(app)
        .get('/api/products')
        .set('Origin', 'http://localhost:3000');

      expect(res.headers).toHaveProperty('access-control-allow-origin', '*');
    });
  });

  describe('Authentication', () => {
    it('should reject requests without token', async () => {
      const res = await request(app).get('/api/orders/myorders');
      expect(res.statusCode).toBe(401);
    });

    it('should reject requests with invalid token', async () => {
      const res = await request(app)
        .get('/api/orders/myorders')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(res.statusCode).toBe(401);
    });
  });

  describe('Input Validation', () => {
    it('should validate email format', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test User',
        email: 'invalid-email',
        password: 'Test123',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/invalid email/i);
    });

    it('should sanitize inputs', async () => {
      const testEmail = `test${Date.now()}@example.com`;
      const res = await request(app).post('/api/auth/register').send({
        name: '<script>alert("xss")</script>Test User<script>',
        email: testEmail,
        password: 'Test123',
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.name).toBe('Test User');
      expect(res.body.email).toBe(testEmail);
    });
  });
});
