'use strict';

const Inventory = require('../models/Inventory');
const AppError = require('../utils/AppError');
const { asyncHandler } = require('../middleware/errorHandler');
const { successResponse, parsePagination } = require('../utils/responseHelpers');

/**
 * GET /api/inventory
 * Query params: ?hospital_id=1&medicine_id=2&page=1&limit=20
 */
const getInventory = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);

  // Parse optional integer filters
  let hospital_id, medicine_id;

  if (req.query.hospital_id !== undefined) {
    hospital_id = parseInt(req.query.hospital_id, 10);
    if (isNaN(hospital_id) || hospital_id < 1) {
      throw new AppError('Query param "hospital_id" must be a positive integer', 400, 'VALIDATION_ERROR');
    }
  }

  if (req.query.medicine_id !== undefined) {
    medicine_id = parseInt(req.query.medicine_id, 10);
    if (isNaN(medicine_id) || medicine_id < 1) {
      throw new AppError('Query param "medicine_id" must be a positive integer', 400, 'VALIDATION_ERROR');
    }
  }

  const { rows, total } = await Inventory.findAll({ hospital_id, medicine_id, limit, offset });

  res.json(successResponse(rows, null, {
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  }));
});

module.exports = { getInventory };
