'use strict';

const { query } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/responseHelpers');

/**
 * GET /api/demand-history
 * Returns real historical demand records from the demand_history table.
 * Used by the Dashboard demand chart.
 *
 * Query params:
 *   hospital_id  - filter by hospital (default: 1)
 *   medicine_id  - filter by medicine
 *   start_date   - YYYY-MM-DD inclusive
 *   end_date     - YYYY-MM-DD inclusive
 *   limit        - max rows (default: 90, max: 365)
 */
const getDemandHistory = asyncHandler(async (req, res) => {
  const {
    hospital_id,
    medicine_id,
    start_date,
    end_date,
  } = req.query;

  const limit = Math.min(365, Math.max(1, parseInt(req.query.limit || '90', 10)));

  const values = [];
  const conditions = [];

  if (hospital_id) {
    values.push(parseInt(hospital_id, 10));
    conditions.push(`d.hospital_id = $${values.length}`);
  }

  if (medicine_id) {
    values.push(parseInt(medicine_id, 10));
    conditions.push(`d.medicine_id = $${values.length}`);
  }

  if (start_date) {
    values.push(start_date);
    conditions.push(`d.date >= $${values.length}`);
  }

  if (end_date) {
    values.push(end_date);
    conditions.push(`d.date <= $${values.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  values.push(limit);

  const result = await query(
    `SELECT
       d.date,
       d.hospital_id,
       h.name AS hospital_name,
       d.medicine_id,
       m.name AS medicine_name,
       ROUND(d.consumption::numeric, 2)       AS consumption,
       d.patient_load,
       ROUND(d.emergency_demand::numeric, 2)  AS emergency_demand,
       d.created_at
     FROM demand_history d
     JOIN hospitals h ON h.id = d.hospital_id
     JOIN medicines  m ON m.id = d.medicine_id
     ${where}
     ORDER BY d.date ASC
     LIMIT $${values.length}`,
    values
  );

  return res.status(200).json(
    successResponse(result.rows, null, { total: result.rows.length })
  );
});

module.exports = { getDemandHistory };
