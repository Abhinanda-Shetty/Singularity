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

/**
 * PATCH /api/inventory/:id
 * Body: { quantity?: number, safety_stock?: number, note?: string }
 */
const updateInventory = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id < 1) {
    throw new AppError('Inventory item ID must be a positive integer', 400, 'VALIDATION_ERROR');
  }

  const { quantity, safety_stock, note } = req.body;

  if (quantity === undefined && safety_stock === undefined) {
    throw new AppError('Provide at least "quantity" or "safety_stock" to update', 400, 'VALIDATION_ERROR');
  }

  if (quantity !== undefined && (isNaN(parseFloat(quantity)) || parseFloat(quantity) < 0)) {
    throw new AppError('Quantity must be a non-negative number', 400, 'VALIDATION_ERROR');
  }

  if (safety_stock !== undefined && (isNaN(parseFloat(safety_stock)) || parseFloat(safety_stock) < 0)) {
    throw new AppError('Safety stock must be a non-negative number', 400, 'VALIDATION_ERROR');
  }

  const updated = await Inventory.updateById(id, { quantity, safety_stock, note });
  if (!updated) {
    throw new AppError(`Inventory item #${id} not found`, 404, 'NOT_FOUND');
  }

  res.json(successResponse(updated, `Stock updated successfully for ${updated.medicine_name || `Item #${id}`}.`));
});

module.exports = { getInventory, updateInventory };
