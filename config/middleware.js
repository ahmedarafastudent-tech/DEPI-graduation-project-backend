const express = require('express');
const promBundle = require('express-prom-bundle');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const { morganMiddleware, logger } = require('./logger');
const AppError = require('../utils/appError');

const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  includeStatusCode: true,
  includeUp: true,
  customLabels: { project_name: 'e_commerce_api' },
});

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const fileUpload = require('express-fileupload');

module.exports = (app) => {
  // Security headers
  app.use(helmet());
  
  // Set specific security headers that tests are expecting
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // CORS
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Total-Count'],
    credentials: true,
    maxAge: 600 // 10 minutes
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false
  });
  app.use('/api', limiter);

  // File upload
  app.use(fileUpload({
    limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5000000 },
    useTempFiles: true,
    tempFileDir: '/tmp/',
    createParentPath: true,
    safeFileNames: true,
    preserveExtension: 4,
    abortOnLimit: true,
    responseOnLimit: 'File size limit has been reached'
  }));

  // Prometheus metrics middleware
  app.use(metricsMiddleware);

  // Request logging with custom morgan format
  app.use(morganMiddleware);

  // Swagger documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Error handling middleware
  app.use((err, req, res, _next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Log error with structured metadata
    logger.error(err.message, {
      metadata: {
        statusCode: err.statusCode,
        path: req.path,
        method: req.method,
        query: req.query,
        body: req.body,
        params: req.params,
        userId: req.user?.id,
        stack: err.stack,
        errorCode: err.code,
        timestamp: new Date().toISOString()
      }
    });

    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  });

  // 404 handler
  app.use((req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
  });
};
