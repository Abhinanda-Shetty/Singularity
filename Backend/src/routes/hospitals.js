'use strict';

const { Router } = require('express');
const { getHospitals, getHospitalById } = require('../controllers/hospitalController');

const router = Router();

// GET /api/hospitals
router.get('/', getHospitals);

// GET /api/hospitals/:id
router.get('/:id', getHospitalById);

module.exports = router;
