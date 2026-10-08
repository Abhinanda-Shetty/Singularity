'use strict';

const { testConnection } = require('../config/database');

/**
 * GET /api/health
 * Returns server status and database connectivity.
 */
async function healthCheck(req, res) {
  const dbStatus = await testConnection();

  const response = {
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    database: dbStatus,
  };

  const httpStatus = dbStatus.connected ? 200 : 503;
  return res.status(httpStatus).json(response);
}

module.exports = { healthCheck };
