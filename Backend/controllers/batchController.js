'use strict';

const Batch = require('../models/Batch');
const AppError = require('../utils/AppError');
const { asyncHandler } = require('../middleware/errorHandler');
const { successResponse, parsePagination } = require('../utils/responseHelpers');

/**
 * GET /api/batches
 * Query params: ?hospital_id=1&medicine_id=2&expiring_within_days=30&page=1&limit=20
 */
const getBatches = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);

  let hospital_id, medicine_id, expiring_within_days;

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

  if (req.query.expiring_within_days !== undefined) {
    expiring_within_days = parseInt(req.query.expiring_within_days, 10);
    if (isNaN(expiring_within_days) || expiring_within_days < 1) {
      throw new AppError('Query param "expiring_within_days" must be a positive integer', 400, 'VALIDATION_ERROR');
    }
  }

  const { rows, total } = await Batch.findAll({
    hospital_id,
    medicine_id,
    expiring_within_days,
    limit,
    offset,
  });

  res.json(successResponse(rows, null, {
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  }));
});

module.exports = { getBatches };
