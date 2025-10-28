const mongoose = require('mongoose');
const app = require('../index');
const supertest = require('supertest');
const request = (appParam) => global.request || supertest(appParam);
const SupportTicket = require('../models/supportTicketModel');
const User = require('../models/userModel');
const { generateToken } = require('../utils/generateToken');

jest.mock('../utils/sendEmail', () => jest.fn().mockResolvedValue(true));

describe('Support Ticket Controller Tests', () => {
  let adminToken;
  let userToken;
  let admin;
  let user;

  beforeAll(async () => {
    admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
      isAdmin: true
    });
    adminToken = generateToken(admin._id);

    user = await User.create({
      name: 'Test User',
      email: 'user@example.com',
      password: 'password123'
    });
    userToken = generateToken(user._id);
  });

  afterAll(async () => {
    await User.deleteMany({});
    await SupportTicket.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await SupportTicket.deleteMany({});
  });

  describe('POST /api/support', () => {
    it('should create a support ticket', async () => {
      const ticketData = {
        subject: 'Test Ticket',
        message: 'This is a test ticket',
        priority: 'medium',
        category: 'general',
        category: 'general'
      };

      const res = await request(app)
        .post('/api/support')
        .set('Authorization', `Bearer ${userToken}`)
        .send(ticketData);

      expect(res.statusCode).toBe(201);
      expect(res.body.subject).toBe('Test Ticket');
      expect(res.body.status).toBe('open');
      expect(res.body.messages).toHaveLength(1);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/support')
        .send({
          subject: 'Test Ticket',
          message: 'This is a test ticket'
        });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/support', () => {
    beforeEach(async () => {
      await SupportTicket.create([
        {
          user: user._id,
          subject: 'Ticket 1',
          messages: [{
            sender: user._id,
            message: 'Test message 1',
            timestamp: new Date()
          }],
          status: 'open',
          priority: 'high',
          category: 'technical',
          category: 'general'
        },
        {
          user: user._id,
          subject: 'Ticket 2',
          messages: [{
            sender: user._id,
            message: 'Test message 2',
            timestamp: new Date()
          }],
          status: 'closed',
          priority: 'low',
          category: 'general'
        }
      ]);
    });

    it('should get all tickets for admin', async () => {
      const res = await request(app)
        .get('/api/support')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('should filter tickets by status', async () => {
      const res = await request(app)
        .get('/api/support')
        .query({ status: 'open' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].status).toBe('open');
    });

    it('should filter tickets by priority', async () => {
      const res = await request(app)
        .get('/api/support')
        .query({ priority: 'high' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].priority).toBe('high');
    });
  });

  describe('GET /api/support/my-tickets', () => {
    beforeEach(async () => {
      await SupportTicket.create([
        {
          user: user._id,
          subject: 'User Ticket',
          messages: [{
            sender: user._id,
            message: 'Test message',
            timestamp: new Date()
          }],
          status: 'open',
          priority: 'medium',
          category: 'general'
        },
        {
          user: admin._id,
          subject: 'Admin Ticket',
          messages: [{
            sender: admin._id,
            message: 'Test message',
            timestamp: new Date()
          }],
          status: 'open',
          priority: 'high',
          category: 'technical'
        }
      ]);
    });

    it('should get only user tickets', async () => {
      const res = await request(app)
        .get('/api/support/my-tickets')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].subject).toBe('User Ticket');
    });
  });

  describe('POST /api/support/:id/message', () => {
    let ticket;

    beforeEach(async () => {
      ticket = await SupportTicket.create({
        user: user._id,
        subject: 'Test Ticket',
        messages: [{
          sender: user._id,
          message: 'Initial message',
          timestamp: new Date()
        }],
        status: 'open',
        priority: 'medium',
        category: 'general'
      });
    });

    it('should add message to ticket', async () => {
      const res = await request(app)
        .post(`/api/support/${ticket._id}/message`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          message: 'New message'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.messages).toHaveLength(2);
      expect(res.body.messages[1].message).toBe('New message');
      expect(res.body.status).toBe('awaiting_response');
    });

    it('should update status when admin replies', async () => {
      const res = await request(app)
        .post(`/api/support/${ticket._id}/message`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          message: 'Admin response'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.messages).toHaveLength(2);
      expect(res.body.status).toBe('open');
    });
  });

  describe('PUT /api/support/:id/status', () => {
    let ticket;

    beforeEach(async () => {
      ticket = await SupportTicket.create({
        user: user._id,
        subject: 'Test Ticket',
        messages: [{
          sender: user._id,
          message: 'Test message',
          timestamp: new Date()
        }],
        status: 'open',
        priority: 'medium',
        category: 'general'
      });
    });

    it('should update ticket status when admin', async () => {
      const res = await request(app)
        .put(`/api/support/${ticket._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'closed'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('closed');
    });

    it('should not allow regular users to update status', async () => {
      const res = await request(app)
        .put(`/api/support/${ticket._id}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          status: 'closed'
        });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('PUT /api/support/:id/priority', () => {
    let ticket;

    beforeEach(async () => {
      ticket = await SupportTicket.create({
        user: user._id,
        subject: 'Test Ticket',
        messages: [{
          sender: user._id,
          message: 'Test message',
          timestamp: new Date()
        }],
        status: 'open',
        priority: 'low',
        category: 'general'
      });
    });

    it('should update ticket priority when admin', async () => {
      const res = await request(app)
        .put(`/api/support/${ticket._id}/priority`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          priority: 'high'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.priority).toBe('high');
    });

    it('should not allow regular users to update priority', async () => {
      const res = await request(app)
        .put(`/api/support/${ticket._id}/priority`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          priority: 'high'
        });

      expect(res.statusCode).toBe(403);
    });
  });
});