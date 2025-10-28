const { logUtil } = require('../config/logger');
const AppError = require('../utils/appError');

const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  
  error.statusCode = 404;
  logUtil.warn('Resource not found', {
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });
  next(error);
};

const errorHandler = (err, req, res, next) => {
  logUtil.logError(err, req);

  const env = process.env.NODE_ENV || 'development';

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((error) => ({
      field: error.path,
      message: error.message,
      type: error.kind,
    }));

    return res.status(400).json({
      status: 'error',
      message: 'Validation Error',
      errors,
      code: 'VALIDATION_ERROR',
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    return res.status(409).json({
      status: 'error',
      message: 'Duplicate Field Error',
      error: `${field} with value '${value}' already exists`,
      field,
      code: 'DUPLICATE_KEY_ERROR',
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token',
      error: err.message,
      code: 'INVALID_TOKEN',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      message: 'Token expired',
      error: err.message,
      code: 'TOKEN_EXPIRED',
    });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      status: 'error',
      message: 'File too large',
      error: 'File size should be less than 5MB',
      code: 'FILE_TOO_LARGE',
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid file upload',
      error: 'Unexpected field in file upload',
      code: 'INVALID_UPLOAD_FIELD',
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid ID format',
      error: `Invalid ${err.path}: ${err.value}`,
      code: 'INVALID_ID_FORMAT',
    });
  }

  if (err.name === 'PayTabsError') {
    return res.status(err.statusCode || 400).json({
      status: 'error',
      message: 'Payment Processing Error',
      error: err.message,
      code: 'PAYMENT_ERROR',
    });
  }

  if (err.type === 'too-many-requests') {
    return res.status(429).json({
      status: 'error',
      message: 'Too Many Requests',
      error: err.message,
      code: 'RATE_LIMIT_EXCEEDED',
    });
  }

  const statusCode =
    err.statusCode ||
    (typeof err.status === 'number' ? err.status : undefined) ||
    res.statusCode ||
    500;
  const isServerError = statusCode >= 500;

  const responseMessage =
    env === 'development' ? err.message : isServerError ? 'Internal server error' : err.message;

  const payload = {
    status: err.status || (isServerError ? 'error' : 'fail'),
    message: responseMessage,
    code: err.code || undefined,
  };

  if (env === 'development') {
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
};

module.exports = { notFound, errorHandler };
