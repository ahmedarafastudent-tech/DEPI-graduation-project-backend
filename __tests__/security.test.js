const supertest = require('supertest');
const request = (appParam) => global.request || supertest(appParam);
const { RATE_LIMIT_MAX_REQUESTS } = require('../constants/security');


jest.mock('redis', () => ({
  createClient: () => ({
    connect: jest.fn().mockResolvedValue(),
    on: jest.fn(),
    quit: jest.fn().mockResolvedValue(),
    duplicate: jest.fn(() => ({ connect: jest.fn().mockResolvedValue(), on: jest.fn(), quit: jest.fn() })),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
  }),
}));

jest.mock('ioredis', () => {
  function MockIORedis() {
    this.on = jest.fn();
    this.connect = jest.fn().mockResolvedValue();
    this.quit = jest.fn().mockResolvedValue();
  }
  return MockIORedis;
});

process.env.CORS_ORIGIN = 'http://localhost:3000';

const app = require('../index');

describe('Security Features', () => {

  describe('Headers Security', () => {
    it('should include security headers', async () => {
  const res = await request(app).get('/api/products');

  expect(res.headers).toHaveProperty('x-content-type-options', 'nosniff');
  expect(res.headers).toHaveProperty('x-frame-options', 'DENY');
  expect(res.headers).toHaveProperty('x-xss-protection', '1; mode=block');
    });
  });

  describe('CORS', () => {
    it('should allow CORS requests', async () => {
      const res = await request(app)
        .get('/api/products')
        .set('Origin', 'http://localhost:3000');

      expect(res.headers).toHaveProperty('access-control-allow-origin', 'http://localhost:3000');
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


  describe('Rate Limiting', () => {
    beforeEach(async () => {
      if (app && app.resetRateLimit) {
        await app.resetRateLimit();
      }
      delete process.env.FORCE_PRODUCTION_LIMITER; 
      await new Promise(resolve => setTimeout(resolve, 100)); 
    });

    afterEach(async () => {
      if (app && app.resetRateLimit) {
        await app.resetRateLimit();
      }
      delete process.env.FORCE_PRODUCTION_LIMITER;
    });

    it('should limit repeated requests', async () => {
      if (app && app.resetRateLimit) {
        await app.resetRateLimit();
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      process.env.FORCE_PRODUCTION_LIMITER = 'true';

      const testIp = '127.0.0.1';
      const sendRequests = async (count, ip = testIp) => {
        const results = [];
        for (let i = 0; i < count; i++) {
          const res = await request(app)
            .get('/api/products')
            .set('X-Test-Rate-Limit', 'true')
            .set('X-Forwarded-For', ip);
          results.push(res.statusCode);
        }
        return results;
      };

      const firstBatch = await sendRequests(RATE_LIMIT_MAX_REQUESTS);
      expect(firstBatch.every(code => code === 200)).toBe(true);

      const limitedRes = await request(app)
        .get('/api/products')
        .set('X-Test-Rate-Limit', 'true')
        .set('X-Forwarded-For', testIp);
      expect(limitedRes.statusCode).toBe(429);

      const diffIpRes = await request(app)
        .get('/api/products')
        .set('X-Test-Rate-Limit', 'true')
        .set('X-Forwarded-For', '1.2.3.4');
      expect(diffIpRes.statusCode).toBe(200);

      await new Promise(resolve => setTimeout(resolve, 100));
    });
  });
});
