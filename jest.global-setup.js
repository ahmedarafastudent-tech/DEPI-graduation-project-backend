module.exports = async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-123';
  process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
  
  // Disable console.log during tests to reduce noise
  const originalLog = console.log;
  console.log = (...args) => {
    if (process.env.DEBUG) {
      originalLog(...args);
    }
  };

  // Store original console methods for restoration
  global.__ORIGINAL_CONSOLE__ = {
    log: originalLog,
  };

  // Clean up any remaining handles
  const cleanup = () => {
    // Restore console
    console.log = originalLog;
  };

  // Clean up on process exit
  process.on('exit', cleanup);
  process.on('SIGTERM', cleanup);
};