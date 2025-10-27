const mongoose = require('mongoose');
const { logger } = require('./logger');

// Connection retry configuration
const MAX_RETRIES = 5;
const RETRY_INTERVAL = 5000; // 5 seconds
let retryCount = 0;

// Connection options
const mongooseOptions = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxPoolSize: 50,
  maxConnecting: 10,
  connectTimeoutMS: 10000,
  retryWrites: true,
  w: 'majority',
  wtimeout: 2500,
  family: 4, // Use IPv4, skip trying IPv6
};

// Helper function to validate MongoDB URI
const validateMongoURI = (uri) => {
  if (!uri) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  const mongoURIPattern = /^mongodb(\+srv)?:\/\/.+/;
  if (!mongoURIPattern.test(uri)) {
    throw new Error('Invalid MongoDB URI format');
  }
};

// Helper function to handle connection retries
const retryConnection = async () => {
  if (retryCount < MAX_RETRIES) {
    retryCount++;
    logger.warn(`Retrying MongoDB connection (${retryCount}/${MAX_RETRIES}) in ${RETRY_INTERVAL/1000} seconds...`);
    await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
    return connectDB();
  }
  
  logger.error('Max MongoDB connection retries reached. Exiting...');
  process.exit(1);
};

// Helper function to setup connection event handlers
const setupConnectionHandlers = (connection) => {
  connection.on('error', (err) => {
    logger.error('MongoDB connection error:', err);
  });

  connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected. Attempting to reconnect...');
  });

  connection.on('reconnected', () => {
    logger.info('MongoDB reconnected');
    retryCount = 0; // Reset retry counter on successful reconnection
  });

  connection.on('reconnectFailed', () => {
    logger.error('MongoDB reconnection failed');
    process.exit(1);
  });

  // Monitor connection for potential issues
  setInterval(() => {
    const state = connection.readyState;
    if (state !== 1) { // 1 = connected
      logger.warn(`MongoDB connection state: ${state}`);
    }
  }, 30000); // Check every 30 seconds
};

// Setup process event handlers for graceful shutdown
const setupProcessHandlers = () => {
  const gracefulShutdown = async (signal) => {
    try {
      logger.info(`${signal} received. Closing MongoDB connection...`);
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    } catch (err) {
      logger.error('Error during MongoDB shutdown:', err);
      process.exit(1);
    }
  };

  // Handle different termination signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    gracefulShutdown('Uncaught Exception');
  });
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('Unhandled Rejection');
  });
};

// Main connection function
const connectDB = async () => {
  try {
    validateMongoURI(process.env.MONGO_URI);

    const conn = await mongoose.connect(process.env.MONGO_URI, mongooseOptions);

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    logger.info(`Database Name: ${conn.connection.name}`);
    logger.info(`MongoDB version: ${await conn.connection.db.admin().serverInfo().then(info => info.version)}`);

    setupConnectionHandlers(mongoose.connection);
    setupProcessHandlers();

    // Reset retry counter on successful connection
    retryCount = 0;

    return conn;
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    
    if (error.name === 'MongoServerSelectionError') {
      logger.error('Could not connect to any MongoDB servers');
      return retryConnection();
    }

    if (error.name === 'MongoNetworkError') {
      logger.error('MongoDB network error');
      return retryConnection();
    }

    process.exit(1);
  }
};

// Export with additional utilities for testing
module.exports = {
  connectDB,
  mongooseOptions,
  validateMongoURI,
  // Export for testing purposes
  _testing: {
    retryConnection,
    setupConnectionHandlers,
    setupProcessHandlers,
  },
};
