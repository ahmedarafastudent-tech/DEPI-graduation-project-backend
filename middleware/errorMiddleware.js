const { logUtil } = require('../config/logger');
const AppError = require('../utils/appError');

const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  logUtil.warn('Resource not found', {
    path: req.originalUrl,
    method: req.method,
    ip: req.ip
  });
  next(error);
};

const errorHandler = (err, req, res, next) => {
  // Log the error
  logUtil.logError(err, req);

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(error => ({
      field: error.path,
      message: error.message,
      type: error.kind
    }));

    return res.status(400).json({
      status: 'error',
      message: 'Validation Error',
      errors,
      code: 'VALIDATION_ERROR'
    });
  }

  // Handle MongoDB duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    return res.status(409).json({
      status: 'error',
      message: 'Duplicate Field Error',
      error: `${field} with value '${value}' already exists`,
      field,
      code: 'DUPLICATE_KEY_ERROR'
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token',
      error: err.message,
      code: 'INVALID_TOKEN'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      message: 'Token expired',
      error: err.message,
      code: 'TOKEN_EXPIRED'
    });
  }

  // Handle Multer/File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      status: 'error',
      message: 'File too large',
      error: 'File size should be less than 5MB',
      code: 'FILE_TOO_LARGE'
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid file upload',
      error: 'Unexpected field in file upload',
      code: 'INVALID_UPLOAD_FIELD'
    });
  }

  // Handle Mongoose CastErrors (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid ID format',
      error: `Invalid ${err.path}: ${err.value}`,
      code: 'INVALID_ID_FORMAT'
    });
  }

  // Handle PayTabs API errors
  if (err.name === 'PayTabsError') {
    return res.status(err.statusCode || 400).json({
      status: 'error',
      message: 'Payment Processing Error',
      error: err.message,
      code: 'PAYMENT_ERROR'
    });
  }

  // Handle rate limit errors
  if (err.type === 'too-many-requests') {
    return res.status(429).json({
      status: 'error',
      message: 'Too Many Requests',
      error: err.message,
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }

  // Default error handling
  // Determine status code
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : err.statusCode || err.status || 500;

  // Ensure response code is set correctly
  res.status(statusCode);

  // Send error response
  const errorResponse = {
    status: 'error',
    message: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_SERVER_ERROR',
    requestId: req.headers['x-correlation-id']
  };

  // Add additional debug information in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.details = err;
  }

  // Send error response
  return res.json(errorResponse);
};

module.exports = { notFound, errorHandler };
