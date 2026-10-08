'use strict';

const { Router } = require('express');
const { getInventory } = require('../controllers/inventoryController');

const router = Router();

// GET /api/inventory
router.get('/', getInventory);

module.exports = router;
