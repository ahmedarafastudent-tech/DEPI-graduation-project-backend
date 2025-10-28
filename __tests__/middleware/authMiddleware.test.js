const jwt = require('jsonwebtoken');
const { protect } = require('../../middleware/authMiddleware');
const { createRateLimiter } = require('../../middleware/security');
const User = require('../../models/userModel');

describe('Auth Middleware', () => {
  describe('protect middleware', () => {
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
      mockReq = {
        headers: {},
        cookies: {},
      };
      mockRes = {
        status: jest.fn(() => mockRes),
        json: jest.fn(),
      };
      mockNext = jest.fn();
    });

    it('should call next() with valid token in Authorization header', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@middleware.com',
        password: 'Test123!@#',
      });

      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || 'testsecret123'
      );

      mockReq.headers.authorization = `Bearer ${token}`;

      await protect(mockReq, mockRes, mockNext);

      expect(mockReq.user).toBeDefined();
      expect(mockReq.user._id.toString()).toBe(user._id.toString());
      expect(mockNext).toHaveBeenCalled();
    });

    it('should call next() with valid token in cookie', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test.cookie@middleware.com',
        password: 'Test123!@#',
      });

      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || 'testsecret123'
      );

      mockReq.cookies.jwt = token;

      await protect(mockReq, mockRes, mockNext);

      expect(mockReq.user).toBeDefined();
      expect(mockReq.user._id.toString()).toBe(user._id.toString());
      expect(mockNext).toHaveBeenCalled();
    });

    it('should throw error if no token provided', async () => {
      let capturedError;
      await protect(mockReq, mockRes, (err) => { capturedError = err; });
      expect(capturedError).toBeDefined();
      expect(capturedError.message).toBe('Not authorized, no token provided');
      expect(capturedError.statusCode).toBe(401);
    });

    it('should throw error for invalid token', async () => {
      mockReq.headers.authorization = 'Bearer invalid.token.here';
      let capturedError;
      await protect(mockReq, mockRes, (err) => { capturedError = err; });
      expect(capturedError).toBeDefined();
      expect(capturedError.message).toBe('Invalid token. Please log in again');
      expect(capturedError.statusCode).toBe(401);
    });

    it('should throw error for expired token', async () => {
      const expiredToken = jwt.sign(
        { id: 'someId' },
        process.env.JWT_SECRET || 'testsecret123',
        { expiresIn: '0s' }
      );

      mockReq.headers.authorization = `Bearer ${expiredToken}`;
      let capturedError;
      await protect(mockReq, mockRes, (err) => { capturedError = err; });
      expect(capturedError).toBeDefined();
      expect(capturedError.message).toBe('Token expired. Please log in again');
      expect(capturedError.statusCode).toBe(401);
    });

    it('should allow anonymous access to analytics events', async () => {
      mockReq.path = '/api/analytics/event';
      mockReq.method = 'POST';

      await protect(mockReq, mockRes, mockNext);

      expect(mockReq.user).toBeNull();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Rate Limiters', () => {
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
      mockReq = {
        ip: '127.0.0.1',
        path: '/api/auth/login',
        headers: {},
      };
      mockRes = {
        status: jest.fn(() => mockRes),
        json: jest.fn(),
      };
      mockNext = jest.fn();
    });

    it('should allow requests within rate limit', async () => {
      const limiter = createRateLimiter(15 * 60 * 1000, 5, 'Too many login attempts');
      await limiter(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should block requests over login rate limit', async () => {
      const limiter = createRateLimiter(15 * 60 * 1000, 5, 'Too many login attempts');
      
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      for (let i = 0; i < 6; i++) {
        await limiter(mockReq, mockRes, mockNext);
      }

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Too many login attempts'
      });
      
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should allow requests within API rate limit', async () => {
      const limiter = createRateLimiter(60 * 60 * 1000, 100, 'Too many requests');
      await limiter(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should block requests over API rate limit', async () => {
      const limiter = createRateLimiter(60 * 60 * 1000, 100, 'Too many requests');
      
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      for (let i = 0; i < 101; i++) {
        await limiter(mockReq, mockRes, mockNext);
      }

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Too many requests'
      });
      
      process.env.NODE_ENV = originalNodeEnv;
    });
  });
});