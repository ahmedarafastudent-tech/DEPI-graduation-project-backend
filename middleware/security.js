const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const { logUtil } = require('../config/logger');

const securityMiddleware = (app) => {
  // Logging helper for security events
  const logSecurityEvent = (type, details) => {
    logUtil.warn('Security event detected', { type, ...details });
  };

  // Set security HTTP headers with Helmet
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", process.env.API_URL || '*'],
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: "same-site" },
    dnsPrefetchControl: { allow: false },
    expectCt: {
      maxAge: 86400,
      enforce: true
    },
    frameguard: { action: "deny" },
    hidePoweredBy: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true
  }));

  // CORS Configuration
  const corsOptions = {
    origin: (origin, callback) => {
      const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',');
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        logSecurityEvent('cors-violation', { origin });
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Correlation-Id'],
    exposedHeaders: ['Content-Range', 'X-Content-Range', 'X-Total-Count'],
    credentials: true,
    maxAge: 86400,
  };
  app.use(cors(corsOptions));

  // Rate limiting
  const createRateLimiter = (windowMs, max, message) => rateLimit({
    windowMs,
    max,
    message: { error: message },
    handler: (req, res, next, options) => {
      logSecurityEvent('rate-limit-exceeded', {
        ip: req.ip,
        path: req.path,
        limit: options.max,
        windowMs: options.windowMs
      });
      res.status(429).json(options.message);
    }
  });

  // API rate limiting
  app.use('/api/', createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    100, // 100 requests per windowMs
    'Too many requests from this IP, please try again after 15 minutes'
  ));

  // Auth endpoints rate limiting
  app.use('/api/auth/', createRateLimiter(
    60 * 60 * 1000, // 1 hour
    5, // 5 attempts per hour
    'Too many login attempts from this IP, please try again after an hour'
  ));

  // Sanitize data against NoSQL query injection
  app.use(mongoSanitize({
    onSanitize: ({ req, key }) => {
      logSecurityEvent('nosql-injection-attempt', {
        key,
        ip: req.ip,
        path: req.path
      });
    }
  }));

  // Prevent XSS attacks
  app.use(xss());

  // Prevent HTTP Parameter Pollution attacks
  app.use(hpp({
    whitelist: [
      'price',
      'rating',
      'countInStock',
      'page',
      'limit',
      'sort',
      'fields',
      'category',
      'brand',
      'status'
    ]
  }));

  // Content Security Policy
  app.use(helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.API_URL || '*'],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  }));

  // Set strict transport security
  app.use(helmet.hsts({
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }));

  // Prevent clickjacking
  app.use(helmet.frameguard({ action: 'deny' }));

  // Hide X-Powered-By header
  app.disable('x-powered-by');

  // Add security headers middleware
  app.use((req, res, next) => {
    // Cache control
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Feature policy
    res.setHeader('Permissions-Policy', 
      'geolocation=(), camera=(), microphone=(), payment=self, usb=()');

    next();
  });

  // Development specific middleware
  if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
      // Log security headers in development
      console.log('Security Headers:', res.getHeaders());
      next();
    });
  }
};

module.exports = securityMiddleware;