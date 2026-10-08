'use strict';

const { Router } = require('express');
const { getBatches } = require('../controllers/batchController');

const router = Router();

// GET /api/batches
router.get('/', getBatches);

module.exports = router;
