'use strict';

const express = require('express');
const router = express.Router();
const { createRequest, getRequests } = require('../controllers/requestsController');

// POST /api/requests
router.post('/', createRequest);

// GET /api/requests
router.get('/', getRequests);

module.exports = router;
