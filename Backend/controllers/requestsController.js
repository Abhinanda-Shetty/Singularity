'use strict';

const dataStore = require('../services/dataStore');
const medicineDataset = require('../services/medicineDatasetService');
const { query, getPool } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/responseHelpers');
const AppError = require('../utils/AppError');

/**
 * POST /api/requests
 * Persist a medicine supply request from a hospital.
 */
const createRequest = asyncHandler(async (req, res) => {
  const {
    medicine_id,
    quantity_required,
    needed_by,
    urgency = 'Normal',
    notes,
    hospital_id = 1,
  } = req.body;

  // Validate
  if (!medicine_id || !quantity_required || !needed_by) {
    throw new AppError(
      'medicine_id, quantity_required, and needed_by are required.',
      400,
      'VALIDATION_ERROR'
    );
  }

  const qty = parseFloat(quantity_required);
  if (isNaN(qty) || qty <= 0) {
    throw new AppError('quantity_required must be a positive number.', 400, 'VALIDATION_ERROR');
  }

  const validUrgencies = ['Normal', 'Urgent', 'Critical'];
  if (!validUrgencies.includes(urgency)) {
    throw new AppError(
      `urgency must be one of: ${validUrgencies.join(', ')}.`,
      400,
      'VALIDATION_ERROR'
    );
  }

  const medicine = medicineDataset.findById(medicine_id) || { name: `Medicine #${medicine_id}` };

  // Try DB first if connected
  try {
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const reqResult = await client.query(
        `INSERT INTO requests (hospital_id, medicine_id, quantity_required, needed_by, urgency, notes)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, status, created_at`,
        [hospital_id, medicine_id, qty, needed_by, urgency, notes || null]
      );
      const newRequest = reqResult.rows[0];

      await client.query(
        `INSERT INTO activity_log
           (hospital_id, medicine_id, type, quantity, description)
         VALUES ($1, $2, 'request', $3, $4)`,
        [hospital_id, medicine_id, qty, `Medicine request: ${qty} ${medicine.name} (${urgency})`]
      );
      await client.query('COMMIT');

      return res.status(201).json(
        successResponse(
          {
            request_id: newRequest.id,
            medicine_id: parseInt(medicine_id, 10),
            medicine_name: medicine.name,
            quantity_required: qty,
            needed_by,
            urgency,
            status: newRequest.status,
            created_at: newRequest.created_at,
          },
          `Medicine request submitted: ${qty} units of ${medicine.name} (${urgency}).`
        )
      );
    } catch (dbErr) {
      await client.query('ROLLBACK');
      throw dbErr;
    } finally {
      client.release();
    }
  } catch (err) {
    // Graceful fallback to dataStore
    const newReq = dataStore.createRequest({
      hospital_id,
      medicine_id,
      quantity_required: qty,
      needed_by,
      urgency,
      notes,
    });

    return res.status(201).json(
      successResponse(
        {
          request_id: newReq.id,
          medicine_id: parseInt(medicine_id, 10),
          medicine_name: medicine.name,
          quantity_required: qty,
          needed_by,
          urgency,
          status: newReq.status,
          created_at: newReq.created_at,
        },
        `Medicine request submitted: ${qty} units of ${medicine.name} (${urgency}).`
      )
    );
  }
});

/**
 * GET /api/requests
 * List requests for a hospital, newest first.
 */
const getRequests = asyncHandler(async (req, res) => {
  const hospital_id = parseInt(req.query.hospital_id || '1', 10);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));

  try {
    const result = await query(
      `SELECT
         r.id,
         r.medicine_id,
         m.name AS medicine_name,
         m.unit AS medicine_unit,
         r.quantity_required,
         r.needed_by,
         r.urgency,
         r.status,
         r.notes,
         r.created_at
       FROM requests r
       JOIN medicines m ON m.id = r.medicine_id
       WHERE r.hospital_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2`,
      [hospital_id, limit]
    );

    if (result && result.rows) {
      return res.status(200).json(
        successResponse(result.rows, null, { total: result.rows.length })
      );
    }
  } catch {
    // Fallback to dataStore
  }

  const list = dataStore.getRequests({ hospital_id: req.query.hospital_id ? hospital_id : undefined, limit });
  return res.status(200).json(
    successResponse(list, null, { total: list.length })
  );
});

/**
 * PATCH /api/requests/:id
 * Update status of a request (e.g. fulfilled, in-transit, cancelled).
 */
const updateRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    throw new AppError('Field "status" is required', 400, 'VALIDATION_ERROR');
  }

  try {
    const result = await query(
      `UPDATE requests SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id]
    );
    if (result && result.rows && result.rows.length > 0) {
      return res.status(200).json(successResponse(result.rows[0]));
    }
  } catch {
    // fallback to dataStore
  }

  const updated = dataStore.updateRequestStatus(id, status);
  if (!updated) {
    throw new AppError('Request not found', 404, 'NOT_FOUND');
  }

  return res.status(200).json(successResponse(updated));
});

module.exports = { createRequest, getRequests, updateRequest };

