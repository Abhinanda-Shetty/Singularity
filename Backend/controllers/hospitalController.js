'use strict';

const Hospital = require('../models/Hospital');
const AppError = require('../utils/AppError');
const { asyncHandler } = require('../middleware/errorHandler');
const { successResponse, parsePagination } = require('../utils/responseHelpers');

/**
 * GET /api/hospitals
 * Query params: ?type=general&page=1&limit=20
 */
const getHospitals = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { type } = req.query;

  const { rows, total } = await Hospital.findAll({ type, limit, offset });

  res.json(successResponse(rows, null, {
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  }));
});

/**
 * GET /api/hospitals/:id
 */
const getHospitalById = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (!id || isNaN(id)) {
    throw new AppError('Invalid hospital ID', 400, 'VALIDATION_ERROR');
  }

  const hospital = await Hospital.findById(id);

  if (!hospital) {
    throw new AppError('Hospital not found', 404, 'NOT_FOUND');
  }

  res.json(successResponse(hospital));
});

module.exports = { getHospitals, getHospitalById };
