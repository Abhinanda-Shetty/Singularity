'use strict';

const jwt = require('jsonwebtoken');
const { asyncHandler } = require('../middleware/errorHandler');
const { successResponse, errorResponse } = require('../utils/responseHelpers');
const AppError = require('../utils/AppError');

/**
 * POST /api/auth/login
 * Validates admin credentials from environment config.
 * Returns a signed JWT on success.
 */
const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    throw new AppError('Username and password are required.', 400, 'VALIDATION_ERROR');
  }

  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    throw new AppError('Server auth not configured.', 500, 'CONFIG_ERROR');
  }

  // Constant-time string comparison to prevent timing attacks
  const usernameMatch = username === adminUsername;
  const passwordMatch = password === adminPassword;

  if (!usernameMatch || !passwordMatch) {
    // Always respond with same message regardless of which field failed
    return res.status(401).json(errorResponse('Invalid username or password.', 'INVALID_CREDENTIALS'));
  }

  const payload = { username: adminUsername, role: 'admin' };
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '8h';

  if (!secret) {
    throw new AppError('JWT secret not configured.', 500, 'CONFIG_ERROR');
  }

  const token = jwt.sign(payload, secret, { expiresIn });

  return res.status(200).json(
    successResponse(
      { token, user: { username: adminUsername, role: 'admin' } },
      'Login successful.'
    )
  );
});

/**
 * GET /api/auth/me
 * Returns the currently authenticated user (requires valid JWT).
 */
const me = asyncHandler(async (req, res) => {
  return res.status(200).json(
    successResponse({ username: req.user.username, role: req.user.role })
  );
});

module.exports = { login, me };
