'use strict';

const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// GET /api/ai/forecast
router.get('/forecast', aiController.getForecast);

// GET /api/ai/risks
router.get('/risks', aiController.getRisks);

// GET /api/ai/analyse
router.get('/analyse', aiController.getFullAnalysis);

// POST /api/ai/redistribute
router.post('/redistribute', aiController.getRedistribution);

module.exports = router;
