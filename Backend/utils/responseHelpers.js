'use strict';

/**
 * Build a standard success response envelope.
 * @param {*} data - Response payload
 * @param {string} [message] - Optional message
 * @param {object} [meta] - Optional pagination/meta info
 */
function successResponse(data, message = null, meta = null) {
  const envelope = { success: true, data };
  if (message) envelope.message = message;
  if (meta) envelope.meta = meta;
  return envelope;
}

/**
 * Build a standard error response envelope.
 * @param {string} error - Error description
 * @param {string} [code] - Application error code
 */
function errorResponse(error, code = 'ERROR') {
  return { success: false, error, code };
}

/**
 * Parse and validate pagination query params.
 * @param {object} query - Express req.query
 * @returns {{ page: number, limit: number, offset: number }}
 */
function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

module.exports = { successResponse, errorResponse, parsePagination };
