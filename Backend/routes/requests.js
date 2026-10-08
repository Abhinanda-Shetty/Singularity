const express = require('express');
const router = express.Router();
const { createRequest, getRequests, updateRequest } = require('../controllers/requestsController');

// POST /api/requests
router.post('/', createRequest);

// GET /api/requests
router.get('/', getRequests);

// PATCH /api/requests/:id
router.patch('/:id', updateRequest);

module.exports = router;

