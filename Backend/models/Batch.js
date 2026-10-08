'use strict';

const dataStore = require('../services/dataStore');
const { query } = require('../config/database');

/**
 * Find all batches with optional filters and pagination.
 */
async function findAll({ hospital_id, medicine_id, expiring_within_days, limit = 50, offset = 0 } = {}) {
  try {
    const res = dataStore.getBatches({ hospital_id, medicine_id, expiring_within_days, limit, offset });
    if (res && res.rows.length > 0) return res;
  } catch (err) {
    console.warn('[BatchModel] dataStore warning, trying DB:', err.message);
  }

  try {
    const values = [];
    const conditions = [];

    if (hospital_id) {
      values.push(hospital_id);
      conditions.push(`b.hospital_id = $${values.length}`);
    }

    if (medicine_id) {
      values.push(medicine_id);
      conditions.push(`b.medicine_id = $${values.length}`);
    }

    if (expiring_within_days !== undefined) {
      values.push(parseInt(expiring_within_days, 10));
      conditions.push(`b.expiry_date <= CURRENT_DATE + ($${values.length} * INTERVAL '1 day')`);
      conditions.push(`b.expiry_date >= CURRENT_DATE`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countResult = await query(`SELECT COUNT(*) AS total FROM batches b ${where}`, values);
    const total = parseInt(countResult.rows[0].total, 10);

    values.push(limit);
    values.push(offset);
    const dataResult = await query(
      `SELECT
         b.id,
         b.hospital_id,
         h.name AS hospital_name,
         b.medicine_id,
         m.name AS medicine_name,
         m.unit  AS medicine_unit,
         b.quantity,
         b.expiry_date,
         b.created_at,
         b.updated_at
       FROM batches b
       JOIN hospitals h ON h.id = b.hospital_id
       JOIN medicines m ON m.id = b.medicine_id
       ${where}
       ORDER BY b.expiry_date ASC, b.id ASC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    return { rows: dataResult.rows, total };
  } catch {
    return dataStore.getBatches({ hospital_id, medicine_id, expiring_within_days, limit, offset });
  }
}

module.exports = { findAll };
