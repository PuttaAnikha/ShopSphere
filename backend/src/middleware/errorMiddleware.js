const env = require('../config/env');
const { errorResponse } = require('../utils/apiResponse');

// 404 Handler for undefined routes
const notFoundHandler = (req, res, next) => {
  return errorResponse(res, 404, `Route ${req.method} ${req.originalUrl} not found`);
};

// Global error handler
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];

  // Mongoose CastError (e.g., invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for field: ${err.path}`;
    errors = [{ field: err.path, message: `Resource not found with id ${err.value}` }];
  }

  // Mongoose Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value entered for ${field}`;
    errors = [{ field, message: `${field} must be unique` }];
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired';
  }

  // Do not expose stack traces in production
  const responsePayload = {
    success: false,
    message,
    errors: Array.isArray(errors) && errors.length > 0 ? errors : [message]
  };

  if (env.NODE_ENV === 'development' && statusCode === 500) {
    responsePayload.stack = err.stack;
  }

  return res.status(statusCode).json(responsePayload);
};

module.exports = {
  notFoundHandler,
  errorHandler
};
