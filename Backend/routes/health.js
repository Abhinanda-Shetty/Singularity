'use strict';

const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { healthCheck } = require('../controllers/healthController');

const router = express.Router();

/**
 * GET /api/health
 * Returns server + database status.
 */
router.get('/health', asyncHandler(healthCheck));

module.exports = router;
