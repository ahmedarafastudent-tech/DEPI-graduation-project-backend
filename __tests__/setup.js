const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const supertest = require('supertest');
const app = require('../index');
const User = require('../models/userModel');

let mongoServer;

beforeAll(async () => {
  // Clear any existing MongoDB connections
  await mongoose.disconnect();

  // Create in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Set MongoDB options
  const mongooseOpts = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
  };

  // Connect to in-memory database
  await mongoose.connect(mongoUri, mongooseOpts);

  // Ensure users collection is empty at the start of each test file run.
  // We drop the collection here so tests that create users in their
  // own beforeAll won't hit duplicate-key errors caused by users
  // from previously-run test files sharing the same in-memory server.
  try {
    await mongoose.connection.db.dropCollection('users');
  } catch (err) {
    // Ignore error if collection doesn't exist
  }

  // Set JWT_SECRET and NODE_ENV
  process.env.JWT_SECRET = 'testsecret123';
  process.env.NODE_ENV = 'test';
});

// Make mongoose.Types.ObjectId callable without `new` to support tests that call
// `mongoose.Types.ObjectId()` (older style). This wraps the class so calling it
// as a function returns a new ObjectId instance.
try {
  const ObjectIdClass = mongoose.Types.ObjectId;
  if (typeof ObjectIdClass === 'function') {
    const wrapper = function (val) {
      return new ObjectIdClass(val);
    };
    // Preserve prototype so instanceof checks still work
    wrapper.prototype = ObjectIdClass.prototype;
    mongoose.Types.ObjectId = wrapper;
  }
} catch (err) {
  // no-op
}

// Clear all test data after each test to ensure a clean slate for
// the next test case while preserving any data created in beforeAll
// for the current test file (prevents deleting users created in beforeAll
// which are used to generate tokens). We skip the 'users' collection so
// tokens generated from users created in beforeAll remain valid
// throughout the test file. This avoids duplicate-key issues while
// keeping per-test isolation for other collections.
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    // Skip deleting the users collection so that users created in a
    // test file's beforeAll remain available throughout that file.
    if (collection.collectionName === 'users') {
      continue;
    }
    try {
      await collection.deleteMany();
    } catch (err) {
      // ignore any delete errors for ephemeral collections
    }
  }
  // Reset rate limiter counters between tests if available
  if (app && typeof app.resetRateLimit === 'function') {
    app.resetRateLimit();
  }
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
});

// Global test utilities
global.request = supertest(app);

// Helper to create test user and get token
global.createTestUser = async (isAdmin = false) => {
  // Use a unique email per invocation to avoid duplicate key issues
  const uniqueEmail = `test+${Date.now()}-${Math.floor(
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
