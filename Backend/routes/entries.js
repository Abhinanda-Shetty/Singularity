'use strict';

const express = require('express');
const router = express.Router();
const { createEntry, getRecentEntries } = require('../controllers/entriesController');

// POST /api/entries   — create a stock_received or usage entry
router.post('/', createEntry);

// GET /api/entries/recent — recent activity feed
router.get('/recent', getRecentEntries);

module.exports = router;
