'use strict';

/**
 * AppError — Operational error class.
 *
 * Use for known/expected errors (validation failures, not found, etc.)
 * that should produce a specific HTTP status code and user-facing message.
 */
class AppError extends Error {
  /**
   * @param {string} message - User-facing error message
   * @param {number} statusCode - HTTP status code (e.g. 400, 404, 422)
   * @param {string} [code] - Application error code (e.g. 'VALIDATION_ERROR')
   */
  constructor(message, statusCode = 500, code = 'APP_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
