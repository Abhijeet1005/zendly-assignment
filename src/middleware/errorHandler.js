const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

function errorHandler(err, req, res, next) {
  let error = err;

  // Log error
  if (error.isOperational) {
    logger.warn('Operational error', {
      code: error.code,
      message: error.message,
      path: req.path,
      method: req.method
    });
  } else {
    logger.error('Unexpected error', {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method
    });
  }

  // Handle specific error types
  if (error.name === 'ValidationError' && error.isJoi) {
    error = {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message
      })),
      isOperational: true
    };
  }

  // Database errors
  if (error.code === '23505') { // Unique violation
    error = {
      statusCode: 409,
      code: 'CONFLICT',
      message: 'Resource already exists',
      isOperational: true
    };
  }

  if (error.code === '23503') { // Foreign key violation
    error = {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Referenced resource does not exist',
      isOperational: true
    };
  }

  // Default to 500 for non-operational errors
  const statusCode = error.statusCode || 500;
  const code = error.code || 'INTERNAL_SERVER_ERROR';
  const message = error.isOperational ? error.message : 'An unexpected error occurred';

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(error.details && { details: error.details }),
      ...(error.resource && { resource: error.resource })
    },
    timestamp: new Date().toISOString()
  });
}

module.exports = errorHandler;
