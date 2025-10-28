const helmet = require('helmet');
const hpp = require('hpp');
const cors = require('cors');
const sanitizeHtml = require('sanitize-html');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = rateLimit;
const { logUtil } = require('../config/logger');


const MODULE_IS_TEST = process.env.NODE_ENV === 'test';

const securityMiddleware = (app) => {
  const logSecurityEvent = (type, details) => {
    logUtil.warn('Security event detected', { type, ...details });
  };

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", process.env.API_URL || '*'],
          fontSrc: ["'self'", 'https:', 'data:'],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: true,
      crossOriginOpenerPolicy: true,
      crossOriginResourcePolicy: { policy: 'same-site' },
      dnsPrefetchControl: { allow: false },
      expectCt: {
        maxAge: 86400,
        enforce: true,
      },
      frameguard: { action: 'deny' },
      hidePoweredBy: true,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      ieNoOpen: true,
      noSniff: true,
      originAgentCluster: true,
      permittedCrossDomainPolicies: { permittedPolicies: 'none' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      xssFilter: false, 
    }),
  );

  const corsOptions = {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const whitelist = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000').split(',');
      
      if (whitelist.indexOf(origin) !== -1 || process.env.NODE_ENV === 'test') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    exposedHeaders: ['set-cookie']
  };

  app.use(cors(corsOptions));


  const resetTracking = {
    limiters: new Set(),
  };

  const createRateLimiter = (windowMs, max, message) => {
    const isTest = MODULE_IS_TEST;
    const actualWindowMs = isTest ? 1000 : windowMs;
    const actualMax = max; 

    if (isTest) {
      const hits = new Map();
      const limiterMiddleware = (req, res, next) => {
        const forceProduction = process.env.FORCE_PRODUCTION_LIMITER === 'true';
        const testHeader = req.get('X-Test-Rate-Limit');
        if (!forceProduction && !req._test_rate_limit && !testHeader) return next();

        try {
          const ip = req.get('X-Forwarded-For') || req.ip;
          const key = `${ip}:${req.url}`;
          const now = Date.now();
          const entry = hits.get(key) || { count: 0, firstTs: now };

          if (now - entry.firstTs > actualWindowMs) {
            entry.count = 0;
            entry.firstTs = now;
          }

          entry.count += 1;
          hits.set(key, entry);

          if (entry.count > max) { 
            logSecurityEvent('rate-limit-exceeded', {
              ip: req.ip,
              path: req.path,
              limit: max,
              windowMs: actualWindowMs,
            });
            return res.status(429).json({ error: message });
          }

          return next();
        } catch (err) {
          return next();
        }
      };

      limiterMiddleware.resetKey = (key) => hits.delete(key);
      limiterMiddleware.resetAll = () => hits.clear();
      resetTracking.limiters.add(limiterMiddleware);
      return limiterMiddleware;
    }

    const limiter = rateLimit({
      windowMs: actualWindowMs,
      max: actualMax,
      message: { error: message },
      skip: (req) => false,
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => `${req.get('X-Forwarded-For') || req.ip}:${req.url}`,
      handler: (req, res, next, options) => {
        logSecurityEvent('rate-limit-exceeded', {
          ip: req.ip,
          path: req.path,
          limit: options.max,
          windowMs: options.windowMs,
        });
        res.status(429).json(options.message);
      },
    });

    return limiter;
  };

  if (MODULE_IS_TEST) {
    app.locals.rateLimitTracking = resetTracking;
  }

  const testMode = process.env.NODE_ENV === 'test';
  app.use(
    '/api/',
    createRateLimiter(
      testMode ? 1000 : 15 * 60 * 1000, 
      process.env.NODE_ENV === 'test' ? 20 : 100,
      'Too many requests, please try again later',
    ),
  );

  
  if (process.env.NODE_ENV === 'test') {
    app.use(
      '/api/auth/',
      createRateLimiter(
        1000, 
        100, 
        'Too many login attempts, please try again later',
      ),
    );
  } else {
    app.use(
      '/api/auth/',
      createRateLimiter(
        60 * 60 * 1000, // 1 hour
        5, // 5 attempts per hour
        'Too many login attempts from this IP, please try again after an hour',
      ),
    );
  }

  // Sanitize data against NoSQL query injection
  app.use(
    mongoSanitize({
      onSanitize: ({ req, key }) => {
        logSecurityEvent('nosql-injection-attempt', {
          key,
          ip: req.ip,
          path: req.path,
        });
      },
    }),
  );

  // Prevent XSS attacks - custom middleware using sanitize-html
  app.use((req, res, next) => {
    if (req.body) {
      for (const [key, value] of Object.entries(req.body)) {
        if (typeof value === 'string') {
          req.body[key] = sanitizeHtml(value, {
            allowedTags: [], // No HTML allowed
            allowedAttributes: {},
            disallowedTagsMode: 'recursiveEscape',
          });
        }
      }
    }
    next();
  });

  // Prevent HTTP Parameter Pollution attacks
  app.use(
    hpp({
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
        'status',
      ],
    }),
  );

  // Content Security Policy
  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", process.env.API_URL || '*'],
        fontSrc: ["'self'", 'https:', 'data:'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    }),
  );

  // Set strict transport security
  app.use(
    helmet.hsts({
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    }),
  );

  // Prevent clickjacking
  app.use(helmet.frameguard({ action: 'deny' }));

  // Hide X-Powered-By header
  app.disable('x-powered-by');

  // Add security headers middleware
  app.use((req, res, next) => {
    // X-XSS-Protection header
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Cache control
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');

    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Feature policy
    res.setHeader(
      'Permissions-Policy',
      'geolocation=(), camera=(), microphone=(), payment=self, usb=()',
    );

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

// Export a named createRateLimiter for tests that need to construct limiters
const createRateLimiterExport = (windowMs, max, message) => {
  const isTest = MODULE_IS_TEST;
  const actualWindowMs = isTest ? 1000 : windowMs;
  const actualMax = max;

  // In test mode return a lightweight in-memory limiter to avoid interacting
  // with express-rate-limit internals (prevents double-count and async store
  // issues during tests). This middleware counts hits per key and enforces
  // the configured max within the window.
  if (isTest) {
    const hits = new Map(); // key -> {count, firstTs}

  const middleware = (req, res, next) => {
  const forceProduction = process.env.NODE_ENV === 'production';
  if (!forceProduction && !req._test_rate_limit) return next();

      try {
        const key = `${ipKeyGenerator(req)}:${req.url}`;
        const now = Date.now();
        const entry = hits.get(key) || { count: 0, firstTs: now };

        // reset window if elapsed
        if (now - entry.firstTs > actualWindowMs) {
          entry.count = 0;
          entry.firstTs = now;
        }

        entry.count += 1;
        hits.set(key, entry);

        if (entry.count > actualMax) {
          return res.status(429).json({ error: message });
        }

        return next();
      } catch (err) {
        // On any unexpected error, allow the request to proceed in tests
        return next();
      }
    };

    // expose simple reset helpers used by tests
    middleware.resetKey = (key) => hits.delete(key);
    middleware.resetAll = () => hits.clear();
    return middleware;
  }

  // Non-test behavior: use express-rate-limit as before
  const limiter = rateLimit({
    windowMs: actualWindowMs,
    max: actualMax,
    message: { error: message },
    skip: (req) => false,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => `${ipKeyGenerator(req)}:${req.url}`,
    handler: (req, res, next, options) => {
      res.status(429).json(options.message);
    },
  });

  limiter.resetKey = (...args) => limiter.store.resetKey(...args);
  limiter.resetAll = () => limiter.store.resetAll();
  return limiter;
};

module.exports = securityMiddleware;
module.exports.createRateLimiter = createRateLimiterExport;
