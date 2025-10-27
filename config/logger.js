const winston = require('winston');
require('winston-daily-rotate-file');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Ensure logs directory exists
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Log format with metadata
const logFormat = winston.format.combine(
  winston.format.errors({ stack: true }),
  winston.format.timestamp(),
  winston.format.metadata({
    fillWith: ['hostname', 'pid', 'level', 'type'],
  }),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp(),
  winston.format.printf(({ timestamp, level, message, metadata, stack }) => {
    let log = `${timestamp} ${level}: ${message}`;
    if (metadata && Object.keys(metadata).length) {
      log += ` ${JSON.stringify(metadata)}`;
    }
    if (stack) {
      log += `\n${stack}`;
    }
    return log;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  defaultMeta: {
    hostname: os.hostname(),
    pid: process.pid,
  },
  transports: [
    // Error logs
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: logFormat,
      maxSize: '20m',
      maxFiles: '14d',
      handleExceptions: true,
      handleRejections: true,
      zippedArchive: true,
    }),
    // Combined logs
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: logFormat,
      maxSize: '20m',
      maxFiles: '14d',
      handleExceptions: true,
      handleRejections: true,
      zippedArchive: true,
    }),
    // HTTP request logs
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, 'http-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'http',
      format: logFormat,
      maxSize: '20m',
      maxFiles: '7d',
      zippedArchive: true,
    }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
      handleExceptions: true,
      handleRejections: true,
    })
  );
}

// Morgan middleware configuration
const morganFormat =
  ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms';

const morganMiddleware = morgan(morganFormat, {
  stream: {
    write: (message) => logger.http(message.trim()),
  },
  skip: (req) => {
    if (process.env.NODE_ENV === 'production') {
      // Skip logging health check endpoints in production
      return req.url === '/health' || req.url === '/api/health';
    }
    return false;
  },
});

// Utility functions for consistent logging
const logUtil = {
  error: (message, meta = {}) => {
    logger.error(message, { metadata: meta });
  },

  warn: (message, meta = {}) => {
    logger.warn(message, { metadata: meta });
  },

  info: (message, meta = {}) => {
    logger.info(message, { metadata: meta });
  },

  http: (message, meta = {}) => {
    logger.http(message, { metadata: meta });
  },

  debug: (message, meta = {}) => {
    logger.debug(message, { metadata: meta });
  },

  logRequest: (req, message = 'Request received') => {
    logger.http(message, {
      metadata: {
        method: req.method,
        url: req.url,
        headers: req.headers,
        query: req.query,
        body: req.body,
        ip: req.ip,
        userId: req.user?.id,
        correlationId: req.headers['x-correlation-id'],
      },
    });
  },

  logResponse: (res, message = 'Response sent') => {
    logger.http(message, {
      metadata: {
        statusCode: res.statusCode,
        responseTime: res.get('X-Response-Time'),
        contentLength: res.get('Content-Length'),
        correlationId: res.get('X-Correlation-Id'),
      },
    });
  },

  logError: (err, req = null) => {
    const errorMeta = {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: err.code,
    };

    if (req) {
      errorMeta.request = {
        method: req.method,
        url: req.url,
        headers: req.headers,
        query: req.query,
        body: req.body,
        ip: req.ip,
        userId: req.user?.id,
        correlationId: req.headers['x-correlation-id'],
      };
    }

    logger.error('Application error', { metadata: errorMeta });
  },

  logPerformance: (label, duration) => {
    logger.info('Performance metric', {
      metadata: {
        type: 'performance',
        label,
        duration,
        timestamp: Date.now(),
      },
    });
  },
};

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (err) => {
  logUtil.error('Uncaught Exception', {
    error: err.stack || err,
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logUtil.error('Unhandled Rejection', {
    reason: reason?.stack || reason,
    promise,
  });
});

module.exports = {
  logger,
  morganMiddleware,
  logUtil,
};
