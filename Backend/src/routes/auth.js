'use strict';

const express = require('express');
const router = express.Router();
const { login, me } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

// POST /api/auth/login — public
router.post('/login', login);

// GET /api/auth/me — requires token
router.get('/me', requireAuth, me);

module.exports = router;
