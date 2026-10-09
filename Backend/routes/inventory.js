'use strict';

const { Router } = require('express');
const { getInventory, updateInventory } = require('../controllers/inventoryController');

const router = Router();

// GET /api/inventory
router.get('/', getInventory);

// PATCH /api/inventory/:id
router.patch('/:id', updateInventory);

// PUT /api/inventory/:id
router.put('/:id', updateInventory);

module.exports = router;
