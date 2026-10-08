'use strict';

const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/responseHelpers');

/**
 * requireAuth middleware
 * Validates the Bearer JWT in the Authorization header.
 * Attaches decoded payload to req.user on success.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json(errorResponse('No token provided.', 'NO_TOKEN'));
  }

  const token = authHeader.slice(7);
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return res.status(500).json(errorResponse('Server auth not configured.', 'CONFIG_ERROR'));
  }

  try {
    const payload = jwt.verify(token, secret);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json(errorResponse('Token is invalid or expired.', 'INVALID_TOKEN'));
  }
}

module.exports = { requireAuth };
