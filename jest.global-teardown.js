const mongoose = require('mongoose');

module.exports = async () => {
  // Restore original console methods
  if (global.__ORIGINAL_CONSOLE__) {
    Object.assign(console, global.__ORIGINAL_CONSOLE__);
    delete global.__ORIGINAL_CONSOLE__;
  }

  // Close all mongoose connections
  try {
    await mongoose.disconnect();
    await mongoose.connection.close();
  } catch (err) {
    console.error('Error closing mongoose connections:', err);
  }

  // Wait a bit for connections to close
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Force garbage collection if possible
  if (global.gc) {
    global.gc();
  }
};