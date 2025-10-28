
module.exports = {
  // Password requirements
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 72,
  PASSWORD_PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  // Reduce the rate limit during tests to avoid exhausting the in-memory
  // limiter when running the entire test suite. Use the standard value
  // in non-test environments.
  RATE_LIMIT_MAX_REQUESTS: process.env.NODE_ENV === 'test' ? 20 : 100,
  RATE_LIMIT_MESSAGE: 'Too many requests from this IP, please try again after 15 minutes',

  // JWT settings
  JWT_EXPIRES_IN: '7d',
  JWT_COOKIE_EXPIRES_IN: 7,
  JWT_ALGORITHM: 'HS512',

  // CORS settings
  CORS_MAX_AGE: 24 * 60 * 60, // 24 hours

  // Security headers
  SECURITY_HEADERS: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'X-Permitted-Cross-Domain-Policies': 'none',
    'Referrer-Policy': 'same-origin',
  },

  // CSP directives
  CSP_DIRECTIVES: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https:'],
    fontSrc: ["'self'", 'https:', 'data:'],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
  },

  // MongoDB settings
  MONGO_CONNECTION_OPTIONS: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 50,
    minPoolSize: 5,
    connectTimeoutMS: 20000,
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 5000,
    family: 4,
    autoIndex: true,
    retryWrites: true,
    heartbeatFrequencyMS: 10000,
    family: 4,
  },

  // Error messages
  ERROR_MESSAGES: {
    UNAUTHORIZED: 'Not authorized to access this resource',
    INVALID_TOKEN: 'Invalid token. Please log in again',
    TOKEN_EXPIRED: 'Your token has expired. Please log in again',
    SERVER_ERROR: 'Internal server error',
  },
};