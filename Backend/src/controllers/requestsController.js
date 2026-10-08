'use strict';

const { query } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/responseHelpers');
const AppError = require('../utils/AppError');
const { getPool } = require('../config/database');

/**
 * POST /api/requests
 * Persist a medicine supply request from a hospital.
 * Does NOT trigger redistribution or PuLP — that is Phase 4 (AI).
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

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verify medicine exists
    const medResult = await client.query(
      'SELECT id, name FROM medicines WHERE id = $1',
      [medicine_id]
    );
    if (medResult.rows.length === 0) {
      throw new AppError(`Medicine with id ${medicine_id} not found.`, 404, 'NOT_FOUND');
    }
    const medicine = medResult.rows[0];

    // Insert request
    const reqResult = await client.query(
      `INSERT INTO requests (hospital_id, medicine_id, quantity_required, needed_by, urgency, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, status, created_at`,
      [hospital_id, medicine_id, qty, needed_by, urgency, notes || null]
    );
    const newRequest = reqResult.rows[0];

    // Record in activity log
    await client.query(
      `INSERT INTO activity_log
         (hospital_id, medicine_id, type, quantity, description)
       VALUES ($1, $2, 'request', $3, $4)`,
      [
        hospital_id,
        medicine_id,
        qty,
        `Medicine request: ${qty} ${medicine.name} | Urgency: ${urgency} | Needed by: ${needed_by}`,
      ]
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
          redistribution_note:
            'Request persisted. AI-based redistribution will be triggered in Phase 4.',
        },
        `Medicine request submitted: ${qty} units of ${medicine.name} (${urgency}).`
      )
    );
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

/**
 * GET /api/requests
 * List requests for a hospital, newest first.
 */
const getRequests = asyncHandler(async (req, res) => {
  const hospital_id = parseInt(req.query.hospital_id || '1', 10);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));

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

  return res.status(200).json(
    successResponse(result.rows, null, { total: result.rows.length })
  );
});

module.exports = { createRequest, getRequests };
