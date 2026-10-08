'use strict';

const Medicine = require('../models/Medicine');
const AppError = require('../utils/AppError');
const { asyncHandler } = require('../middleware/errorHandler');
const { successResponse, parsePagination } = require('../utils/responseHelpers');

/**
 * GET /api/medicines
 * Query params: ?category=antibiotic&critical=true&page=1&limit=20
 */
const getMedicines = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { category } = req.query;

  // Parse optional critical filter — only apply if explicitly passed
  let critical;
  if (req.query.critical !== undefined) {
    if (req.query.critical === 'true') critical = true;
    else if (req.query.critical === 'false') critical = false;
    else throw new AppError('Query param "critical" must be "true" or "false"', 400, 'VALIDATION_ERROR');
  }

  const { rows, total } = await Medicine.findAll({ category, critical, limit, offset });

  res.json(successResponse(rows, null, {
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  }));
});

/**
 * GET /api/medicines/:id
 */
const getMedicineById = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (!id || isNaN(id)) {
    throw new AppError('Invalid medicine ID', 400, 'VALIDATION_ERROR');
  }

  const medicine = await Medicine.findById(id);

  if (!medicine) {
    throw new AppError('Medicine not found', 404, 'NOT_FOUND');
  }

  res.json(successResponse(medicine));
});

module.exports = { getMedicines, getMedicineById };
