'use strict';

const { Router } = require('express');
const { getMedicines, getMedicineById } = require('../controllers/medicineController');

const router = Router();

// GET /api/medicines
router.get('/', getMedicines);

// GET /api/medicines/:id
router.get('/:id', getMedicineById);

module.exports = router;
