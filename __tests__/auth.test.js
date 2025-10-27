const request = require('supertest');
const app = require('../index');
const User = require('../models/userModel');

describe('Auth Endpoints', () => {
  describe('POST /api/auth/register', () => {
    const validPassword = 'Test123!@#';

    it('should register a new user with valid data', async () => {
      const uniqueEmail = `john${Date.now()}${Math.random().toString(36).slice(2)}@example.com`;
      const res = await request(app).post('/api/auth/register').send({
        name: 'John Doe',
        email: uniqueEmail,
        password: validPassword,
      });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.email).toBe(uniqueEmail);
    });

    it('should not register user with existing email', async () => {
      const uniqueEmail = `john${Date.now()}${Math.random().toString(36).slice(2)}@example.com`;
      await User.create({
        name: 'John Doe',
        email: uniqueEmail,
        password: validPassword,
      });

      const res = await request(app).post('/api/auth/register').send({
        name: 'John Doe',
        email: uniqueEmail,
        password: validPassword,
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('should not register user with invalid password format', async () => {
      const uniqueEmail = `john${Date.now()}${Math.random().toString(36).slice(2)}@example.com`;
      const res = await request(app).post('/api/auth/register').send({
        name: 'John Doe',
        email: uniqueEmail,
        password: 'weak',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/password must contain/i);
    });

    it('should not register user with invalid name format', async () => {
      const uniqueEmail = `john${Date.now()}${Math.random().toString(36).slice(2)}@example.com`;
      const res = await request(app).post('/api/auth/register').send({
        name: 'J', // Too short
        email: uniqueEmail,
        password: validPassword,
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/name must be between/i);
    });

    it('should sanitize HTML in name field', async () => {
      const uniqueEmail = `john${Date.now()}${Math.random().toString(36).slice(2)}@example.com`;
      const res = await request(app).post('/api/auth/register').send({
        name: '<script>alert("xss")</script>John Doe',
        email: uniqueEmail.replace('@', '_xss@'),
        password: validPassword,
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.name).toBe('John Doe');
    });
  });

  describe('POST /api/auth/login', () => {
    const validPassword = 'Test123!@#';
    let loginEmail;

    beforeEach(async () => {
      // generate a fresh email per test to avoid duplicate-key when users are preserved across tests
      loginEmail = `johnlogin${Date.now()}${Math.random().toString(36).slice(2)}@example.com`;
      await User.create({
        name: 'John Doe',
        email: loginEmail,
        password: validPassword,
      });
    });

    it('should login with valid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: loginEmail,
        password: validPassword,
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should not login with invalid password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: loginEmail,
        password: 'wrong',
      });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/invalid/i);
    });

    it('should not login with invalid email', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nonexistent@example.com',
        password: validPassword,
      });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/invalid/i);
    });

    it('should normalize email addresses', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: loginEmail.toUpperCase(), // Different case to test normalization
        password: validPassword,
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
    });
  });
});
