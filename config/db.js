const { logger } = require('./logger');
const mongoose = require('mongoose');

// Connection configuration
const config = {
  retries: {
    max: 5,
    interval: 5000, // 5 seconds
    count: 0
  },
  options: {
    base: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    },
    production: {
      maxPoolSize: 50,
      minPoolSize: 10,
      connectTimeoutMS: 20000,
      socketTimeoutMS: 45000,
      family: 4,
      autoIndex: false,
      retryWrites: true,
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 10000
    }
  }
};

// Helper to return connection options according to NODE_ENV
const getConnectionOptions = () => {
  const env = process.env.NODE_ENV || 'development';
  const base = config.options.base || {};

  // Allow overrides via environment variables for pool sizing (useful in production).
  const maxPool = Number(process.env.MONGO_MAX_POOL_SIZE || process.env.MONGO_MAX_POOL || 50);
  const minPool = Number(process.env.MONGO_MIN_POOL_SIZE || process.env.MONGO_MIN_POOL || 5);

  const poolOptions = {
    maxPoolSize: maxPool,
    minPoolSize: minPool,
    // Keep the base options to ensure stable connections.
    socketTimeoutMS: base.socketTimeoutMS || 45000,
    serverSelectionTimeoutMS: base.serverSelectionTimeoutMS || 5000,
  };

  if (env === 'production') {
    return { ...base, ...(config.options.production || {}), ...poolOptions };
  }
  if (env === 'test') {
    return { ...base, ...(config.options.test || {}), ...poolOptions };
  }
  return { ...base, ...poolOptions };
};

const mongooseOptions = getConnectionOptions();

const validateMongoURI = (uri) => {
  if (!uri) {
    throw new Error('MONGO_URI is not set or invalid');
  }
  if (!/^mongodb(?:\+srv)?:\/\//.test(uri)) {
    throw new Error('Invalid MongoDB URI format');
  }
};


const retryConnection = async (uri) => {
  config.retries.count = (config.retries.count || 0) + 1;
  if (config.retries.count > config.retries.max) {
    throw new Error('Exceeded max MongoDB connection retries');
  }

  const wait = (ms) => new Promise((res) => setTimeout(res, ms));
  const backoff = config.retries.interval * config.retries.count;
  logger.warn(`MongoDB connection failed, retrying in ${backoff}ms (attempt ${config.retries.count})`);
  await wait(backoff);
  return connectDB(uri);
};


const setupConnectionHandlers = (connection) => {
  if (!connection || typeof connection.on !== 'function') return;

  connection.on('error', (err) => {
    logger.error('MongoDB connection error', err);
  });

  connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });
};

const setupProcessHandlers = () => {
  const gracefulExit = async () => {
    try {
      await mongoose.disconnect();
      logger.info('Mongoose disconnected through app termination');
      process.exit(0);
    } catch (err) {
      logger.error('Error during mongoose disconnect', err);
      process.exit(1);
    }
  };

  process.once('SIGINT', gracefulExit);
  process.once('SIGTERM', gracefulExit);
};

const connectDB = async (uri) => {
  const mongoUri = uri || process.env.MONGO_URI;
  validateMongoURI(mongoUri);

  try {
    const conn = await mongoose.connect(mongoUri, mongooseOptions);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    setupConnectionHandlers(conn.connection);
    setupProcessHandlers();
    config.retries.count = 0;
    return conn;
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    if (['MongoServerSelectionError', 'MongoNetworkError'].includes(error.name)) {
      return retryConnection(uri);
    }
    throw error;
  }
};

module.exports = {
  connectDB,
  mongooseOptions,
  validateMongoURI,
  _testing: {
    retryConnection,
    setupConnectionHandlers,
    setupProcessHandlers,
  },
};
