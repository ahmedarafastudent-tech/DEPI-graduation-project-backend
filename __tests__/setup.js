const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const supertest = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { faker } = require('@faker-js/faker');
const User = require('../models/userModel');
const { createUserAndToken, createProduct } = require('./testUtils');
const redisMock = require('./mocks/redisMock');

global.createUserAndToken = createUserAndToken;
global.createProduct = createProduct;


jest.mock('redis', () => require('./mocks/redisMock'));
jest.mock('ioredis', () => require('./mocks/redisMock'));

jest.mock('../utils/sendEmail', () => require('./mocks/mailMock'));
jest.mock('nodemailer', () => require('./mocks/mailMock'));

process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret123';
process.env.NODE_ENV = 'test';

let mongoServer;
let app;

jest.setTimeout(120000); 

beforeAll(async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      await mongoose.disconnect();
    }

    mongoServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'jest-test-db',
        port: 27017 + Math.floor(Math.random() * 1000),
      }
    });
    const mongoUri = mongoServer.getUri();

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    });

    const expressApp = require('../index');
    if (!expressApp) {
      throw new Error('Failed to initialize Express app');
    }
    app = expressApp;

    global.request = supertest(app);

    await mongoose.connection.db.dropDatabase();

    if (app && typeof app.resetRateLimit === 'function') {
      await app.resetRateLimit();
    }

    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }

    if (!redisMock || typeof redisMock.reset !== 'function') {
      throw new Error('Redis mock not properly initialized');
    }
    redisMock.reset();
    
    global.setUserData = async ({ username, email, password = 'password123' }) => {
      const userData = {
        username: username || faker.internet.userName(),
        email: email || faker.internet.email(),
        password: password,
      };
      
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await User.create({
        ...userData,
        password: hashedPassword,
      });
      
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    return { user, token, password: userData.password };
  };
} catch (error) {
  console.error('Error in test setup:', error);
  throw error;
}
});


try {
  const ObjectIdClass = mongoose.Types.ObjectId;
  if (typeof ObjectIdClass === 'function') {
    const wrapper = function (val) {
      return new ObjectIdClass(val);
    };
    wrapper.prototype = ObjectIdClass.prototype;
    mongoose.Types.ObjectId = wrapper;
  }
} catch (err) {
  // no-op
}

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    if (collection.collectionName === 'users') {
      continue;
    }
    try {
      await collection.deleteMany({});
    } catch (err) {
      // ignore any delete errors for ephemeral collections
    }
  }

  if (app && typeof app.resetRateLimit === 'function') {
    try {
      await app.resetRateLimit();
    } catch (err) {
      // Log but don't fail tests due to rate limiter reset
      // eslint-disable-next-line no-console
      console.warn('Rate limiter reset error:', err.message || err);
    }
  }

  if (global.gc) global.gc();
});

afterAll(async () => {
  try {
    if (app && typeof app.resetRateLimit === 'function') {
      await app.resetRateLimit();
    }

    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
      await mongoose.disconnect();
    }

    if (mongoServer) {
      await mongoServer.stop({ doCleanup: true, force: true });
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Cleanup error:', err);
    throw err;
  }
});

global.request = supertest(app);

global.createTestUser = async (isAdmin = false) => {
  const uniqueEmail = `test${Date.now()}-${Math.floor(
    Math.random() * 10000
  )}@example.com`;
  const user = await User.create({
    name: 'Test User',
    email: uniqueEmail,
    password: '123456',
    isAdmin,
  });

  const response = await request.post('/api/auth/login').send({
    email: uniqueEmail,
    password: '123456',
  });

  return {
    user,
    token: response.body.token,
  };
};
