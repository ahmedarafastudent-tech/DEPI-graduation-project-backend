/*
 Notes:
 - Imports the app from `app.js` which re-exports the main Express app without starting an HTTP server.
 - Uses the existing test setup (global in-memory MongoDB) provided by `__tests__/setup.js`.
 - Uses deterministic tokens for reset flows by stubbing `crypto.randomBytes` where needed.
 - Assumes `__tests__/setup.js` already mocks outbound email sending.
*/

const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const http = require('http');

const app = require('../app');
const User = require('../models/userModel');
const generateToken = require('../utils/generateToken');

// Create a server instance that we can close between tests
let server;

describe('Auth Controller Integration Tests', () => {
  let api;

  beforeAll((done) => {
    // Create server for this test suite
    server = http.createServer(app);
    server.listen(0, () => { // Use port 0 for random available port
      done();
    });
    api = () => request(server);
  });

  afterAll((done) => {
    // Clean up both server and database connections
    if (server) {
      server.close(() => {
        mongoose.connection.close()
          .then(() => done())
          .catch(() => done());
      });
    } else {
      mongoose.connection.close()
        .then(() => done())
        .catch(() => done());
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  const genEmail = (prefix = 'test') =>
    `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2)}@example.com`;

  describe('Registration', () => {
    it('registers a user with valid data', async () => {
      const email = genEmail('register');
      const res = await api()
        .post('/api/auth/register')
        .send({ name: 'John Doe', email, password: 'StrongPass123!' });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.email).toBe(email);
    });

    it('returns 400 for missing required fields', async () => {
      const res = await api()
        .post('/api/auth/register')
        .send({ email: genEmail('missing') });

      expect(res.statusCode).toBe(400);
    });

    it('rejects duplicate email registration', async () => {
      const email = genEmail('dup');
      await User.create({ name: 'Existing', email, password: 'Password1!' });

      const res = await api()
        .post('/api/auth/register')
        .send({ name: 'New', email, password: 'Password2!' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message || res.body.error).toMatch(/already exists|duplicate/i);
    });
  });

  describe('Login', () => {
    const TEST_PASSWORD = 'LoginPass123!';
    let userEmail;

    beforeEach(async () => {
      userEmail = genEmail('login');
      await User.create({ name: 'Login User', email: userEmail, password: TEST_PASSWORD });
    });

    it('logs in with valid credentials', async () => {
      const res = await api()
        .post('/api/auth/login')
        .send({ email: userEmail, password: TEST_PASSWORD });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('returns 401 with wrong password', async () => {
      const res = await api()
        .post('/api/auth/login')
        .send({ email: userEmail, password: 'WrongPassword' });

      expect(res.statusCode).toBe(401);
      expect(res.body.message || res.body.error).toMatch(/invalid/i);
    });

    it('returns 401 for non-existent user', async () => {
      const res = await api()
        .post('/api/auth/login')
        .send({ email: 'no.such.user@example.com', password: 'Whatever123!' });

      expect(res.statusCode).toBe(401);
      expect(res.body.message || res.body.error).toMatch(/invalid/i);
    });
  });

  describe('Profile access', () => {
    it('returns profile with valid token', async () => {
      const email = genEmail('profile');
      const user = await User.create({ name: 'Profile User', email, password: 'Pwd12345' });
      const token = generateToken(user._id);

      const res = await api().get('/api/auth/profile').set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('email');
    });

    it('rejects without token', async () => {
      const res = await api().get('/api/auth/profile');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('Forgot & Reset password', () => {
    let user;
    const NEW_PASSWORD = 'NewSecure123!';

    beforeEach(async () => {
      user = await User.create({
        name: 'Reset User',
        email: genEmail('reset'),
        password: 'OldPwd123!',
      });
    });

    it('initiates forgot-password and sets reset token', async () => {
      const fakeBuf = Buffer.alloc(20, 0x41);
      const fakeToken = fakeBuf.toString('hex');
      const rndSpy = jest.spyOn(crypto, 'randomBytes').mockReturnValue(fakeBuf);

      const res = await api().post('/api/auth/forgot-password').send({ email: user.email });

      expect(res.statusCode).toBe(200);
      expect(res.body.message || res.body.msg).toMatch(/email sent/i);

      const updated = await User.findById(user._id);
      expect(updated.resetPasswordToken).toBeDefined();
      expect(updated.resetPasswordExpires).toBeDefined();

      rndSpy.mockRestore();
    });

    it('resets password with valid token', async () => {
      const fakeBuf = Buffer.alloc(20, 0x42);
      const fakeToken = fakeBuf.toString('hex');
      const rndSpy = jest.spyOn(crypto, 'randomBytes').mockReturnValue(fakeBuf);

      const initRes = await api().post('/api/auth/forgot-password').send({ email: user.email });
      expect(initRes.statusCode).toBe(200);

      const resetRes = await api()
        .put(`/api/auth/reset-password/${fakeToken}`)
        .send({ password: NEW_PASSWORD });

      expect(resetRes.statusCode).toBe(200);
      expect(resetRes.body.message || resetRes.body.msg).toMatch(/password/i);

      const after = await User.findById(user._id).select('+password');
      const match = await bcrypt.compare(NEW_PASSWORD, after.password);
      expect(match).toBe(true);

      rndSpy.mockRestore();
    });

    it('returns 400 for invalid/expired token', async () => {
      const res = await api()
        .put('/api/auth/reset-password/invalid-token-123')
        .send({ password: 'Whatever123!' });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('Email verification', () => {
    it('verifies email with valid token', async () => {
      const token = `verify-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const u = await User.create({
        name: 'Verify User',
        email: genEmail('verify'),
        password: 'Pass123!',
        verificationToken: token,
        isVerified: false,
      });

      const res = await api().get(`/api/auth/verify-email/${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.message || res.body.msg).toMatch(/verified/i);

      const updated = await User.findById(u._id);
      expect(updated.isVerified).toBe(true);
      expect(updated.verificationToken).toBeUndefined();
    });

    it('returns 400 for invalid verification token', async () => {
      const res = await api().get('/api/auth/verify-email/does-not-exist');
      expect(res.statusCode).toBe(400);
    });
  });
});
