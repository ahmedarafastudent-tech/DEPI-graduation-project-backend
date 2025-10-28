module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/'
  ],
  verbose: true,
  detectOpenHandles: true, // Detect async operations that keep running
  forceExit: false, // Don't force exit, let Jest handle cleanup
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  setupFilesAfterEnv: [
    './__tests__/setup.js'
  ],
  testTimeout: 30000, // 30 second timeout per test
  
  // Transform files with babel-jest
  transform: {
    '^.+\\.jsx?$': ['babel-jest', {
      presets: ['@babel/preset-env'],
      plugins: ['@babel/plugin-transform-runtime']
    }]
  },
  
  // Transform ES modules in node_modules
  transformIgnorePatterns: [
    "/node_modules/(?!@faker-js/faker)"
  ],

  // Tell Jest to handle module mocks properly
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  
  // For code coverage
  collectCoverage: true,
  collectCoverageFrom: [
    'controllers/**/*.js',
    'models/**/*.js',
    'routes/**/*.js',
    'middleware/**/*.js',
    'utils/**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!jest.config.js'
  ],
  coverageDirectory: 'coverage',
  
  // Global setup and teardown
  globalSetup: './jest.global-setup.js',
  globalTeardown: './jest.global-teardown.js',
};
