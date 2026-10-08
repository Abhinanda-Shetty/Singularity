'use strict';

const dataStore = require('../services/dataStore');
const { query } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/responseHelpers');

/**
 * GET /api/demand-history
 * Returns historical demand records.
 * Query params:
 *   hospital_id  - filter by hospital (default: 1)
 *   medicine_id  - filter by medicine
 *   start_date   - YYYY-MM-DD inclusive
 *   end_date     - YYYY-MM-DD inclusive
 *   limit        - max rows (default: 90, max: 365)
 */
const getDemandHistory = asyncHandler(async (req, res) => {
  const { hospital_id, medicine_id, start_date, end_date } = req.query;
  const limit = Math.min(365, Math.max(1, parseInt(req.query.limit || '90', 10)));

  // Try dataStore first
  try {
    const list = dataStore.getDemandHistory({ hospital_id, medicine_id, start_date, end_date, limit });
    if (list && list.length > 0) {
      return res.status(200).json(successResponse(list, null, { total: list.length }));
    }
  } catch (err) {
    console.warn('[DemandHistoryController] dataStore warning, trying DB:', err.message);
  }

  // DB fallback
  try {
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
  } catch {
    const fallbackList = dataStore.getDemandHistory({ hospital_id, medicine_id, start_date, end_date, limit });
    return res.status(200).json(
      successResponse(fallbackList, null, { total: fallbackList.length })
    );
  }
});

module.exports = { getDemandHistory };
