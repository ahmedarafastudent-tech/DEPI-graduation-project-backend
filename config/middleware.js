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

module.exports = (app) => {
  
  const securityMiddleware = require('../middleware/security');
  securityMiddleware(app);

  app.use(metricsMiddleware);

  app.use(morganMiddleware);

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use(
    fileUpload({
      useTempFiles: true,
      tempFileDir: '/tmp/',
      createParentPath: true,
      safeFileNames: true,
      preserveExtension: 4,
      abortOnLimit: true,
      responseOnLimit: 'File size limit has been reached',
    }),
  );

  app.use((err, req, res, _next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

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
      },
    });

    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  });

  app.use((req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
  });
};
