'use strict';

/**
 * 404 handler — catches routes not matched by any registered handler.
 */
function notFoundMiddleware(req, res, _next) {
  return res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
    code: 'ROUTE_NOT_FOUND',
  });
}

/**
 * Centralized error middleware.
 * Must have 4 parameters for Express to treat it as error middleware.
 */
// eslint-disable-next-line no-unused-vars
function errorMiddleware(err, req, res, _next) {
  console.error('[Error]', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
  });

  const statusCode = err.statusCode || err.status || 500;
  const message = err.isOperational ? err.message : 'Internal server error';

  return res.status(statusCode).json({
    success: false,
    error: message,
    code: err.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

/**
 * Wraps an async route handler to catch rejected promises
 * and forward them to the error middleware.
 */
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { notFoundMiddleware, errorMiddleware, asyncHandler };
