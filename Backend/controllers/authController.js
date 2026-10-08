'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dataStore = require('../services/dataStore');
const { query } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const { successResponse, errorResponse } = require('../utils/responseHelpers');
const AppError = require('../utils/AppError');

/**
 * Generate a JWT token for a given user payload.
 */
function generateToken(user) {
  const secret = process.env.JWT_SECRET || 'singularity_default_jwt_secret_2026';
  const expiresIn = process.env.JWT_EXPIRES_IN || '8h';
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role || 'hospital_admin',
    hospital_id: user.hospital_id || 1,
  };
  return jwt.sign(payload, secret, { expiresIn });
}

/**
 * POST /api/auth/signup
 * Register a new user in the database.
 */
const signup = asyncHandler(async (req, res) => {
  const { username, email, password, hospital_id = 1, role = 'hospital_admin' } = req.body;

  if (!username || !username.trim()) {
    throw new AppError('Username is required.', 400, 'VALIDATION_ERROR');
  }

  if (username.trim().length < 3) {
    throw new AppError('Username must be at least 3 characters long.', 400, 'VALIDATION_ERROR');
  }

  if (!password || password.length < 6) {
    throw new AppError('Password must be at least 6 characters long.', 400, 'VALIDATION_ERROR');
  }

  const cleanUsername = username.trim();
  const cleanEmail = email ? email.trim().toLowerCase() : null;

  // 1. Check if user already exists
  let existingUser = null;

  try {
    const checkRes = await query(
      `SELECT id FROM users WHERE LOWER(username) = LOWER($1) OR (email IS NOT NULL AND LOWER(email) = LOWER($2))`,
      [cleanUsername, cleanEmail || '']
    );
    if (checkRes.rows && checkRes.rows.length > 0) {
      existingUser = checkRes.rows[0];
    }
  } catch {
    existingUser = dataStore.findUser(cleanUsername) || (cleanEmail ? dataStore.findUser(cleanEmail) : null);
  }

  if (existingUser) {
    return res.status(409).json(
      errorResponse('Username or email is already registered.', 'USER_EXISTS')
    );
  }

  // 2. Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // 3. Insert user into DB or resilient dataStore
  let createdUser = null;

  try {
    const insertRes = await query(
      `INSERT INTO users (username, email, password_hash, role, hospital_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, role, hospital_id, created_at`,
      [cleanUsername, cleanEmail, passwordHash, role, parseInt(hospital_id, 10) || 1]
    );
    createdUser = insertRes.rows[0];
  } catch {
    createdUser = dataStore.createUser({
      username: cleanUsername,
      email: cleanEmail,
      password_hash: passwordHash,
      role,
      hospital_id,
    });
  }

  // 4. Generate JWT
  const token = generateToken(createdUser);

  return res.status(201).json(
    successResponse(
      {
        token,
        user: {
          id: createdUser.id,
          username: createdUser.username,
          email: createdUser.email,
          role: createdUser.role,
          hospital_id: createdUser.hospital_id,
        },
      },
      'Account created successfully.'
    )
  );
});

/**
 * POST /api/auth/login
 * Dynamic authentication validating against database users.
 */
const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    throw new AppError('Username and password are required.', 400, 'VALIDATION_ERROR');
  }

  const cleanIdentifier = username.trim();

  // 1. Search in DB
  let user = null;

  try {
    const userRes = await query(
      `SELECT id, username, email, password_hash, role, hospital_id
       FROM users
       WHERE LOWER(username) = LOWER($1) OR (email IS NOT NULL AND LOWER(email) = LOWER($1))`,
      [cleanIdentifier]
    );
    if (userRes.rows && userRes.rows.length > 0) {
      user = userRes.rows[0];
    }
  } catch {
    // fallback
  }

  // Fallback to dataStore if not found in DB
  if (!user) {
    user = dataStore.findUser(cleanIdentifier);
  }

  // Fallback check against process.env ADMIN credentials
  if (!user && process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
    if (cleanIdentifier === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
      user = {
        id: 1,
        username: process.env.ADMIN_USERNAME,
        email: 'admin@medsupply.org',
        role: 'admin',
        hospital_id: 1,
      };
      const token = generateToken(user);
      return res.status(200).json(
        successResponse({ token, user }, 'Login successful.')
      );
    }
  }

  if (!user) {
    return res.status(401).json(errorResponse('Invalid username or password.', 'INVALID_CREDENTIALS'));
  }

  // Verify password hash
  const passwordMatch = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatch) {
    return res.status(401).json(errorResponse('Invalid username or password.', 'INVALID_CREDENTIALS'));
  }

  const token = generateToken(user);

  return res.status(200).json(
    successResponse(
      {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          hospital_id: user.hospital_id,
        },
      },
      'Login successful.'
    )
  );
});

/**
 * GET /api/auth/me
 * Returns currently authenticated user profile.
 */
const me = asyncHandler(async (req, res) => {
  return res.status(200).json(
    successResponse({
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
      hospital_id: req.user.hospital_id,
    })
  );
});

module.exports = { signup, login, me };
