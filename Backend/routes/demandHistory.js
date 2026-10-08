'use strict';

const express = require('express');
const router = express.Router();
const { getDemandHistory } = require('../controllers/demandHistoryController');

// GET /api/demand-history
router.get('/', getDemandHistory);

module.exports = router;
