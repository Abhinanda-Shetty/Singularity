'use strict';

const { Router } = require('express');
const { getHospitals, getHospitalById, createHospital } = require('../controllers/hospitalController');

const router = Router();

// GET /api/hospitals
router.get('/', getHospitals);

// POST /api/hospitals
router.post('/', createHospital);

// GET /api/hospitals/:id
router.get('/:id', getHospitalById);


module.exports = router;
