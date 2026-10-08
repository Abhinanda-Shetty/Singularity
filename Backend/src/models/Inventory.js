'use strict';

const { query } = require('../config/database');

/**
 * Inventory Model — raw SQL query layer.
 * Joins with hospitals and medicines for enriched responses.
 */

/**
 * Find all inventory records with optional filters and pagination.
 * @param {{ hospital_id?: number, medicine_id?: number, limit: number, offset: number }} options
 * @returns {{ rows: object[], total: number }}
 */
async function findAll({ hospital_id, medicine_id, limit, offset }) {
  const values = [];
  const conditions = [];

  if (hospital_id) {
    values.push(hospital_id);
    conditions.push(`i.hospital_id = $${values.length}`);
  }

  if (medicine_id) {
    values.push(medicine_id);
    conditions.push(`i.medicine_id = $${values.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  // Count query
  const countResult = await query(
    `SELECT COUNT(*) AS total FROM inventory i ${where}`,
    values
  );
  const total = parseInt(countResult.rows[0].total, 10);

  // Data query — join hospital name and medicine name for convenience
  values.push(limit);
  values.push(offset);
  const dataResult = await query(
    `SELECT
       i.id,
       i.hospital_id,
       h.name AS hospital_name,
       i.medicine_id,
       m.name AS medicine_name,
       m.unit  AS medicine_unit,
       i.quantity,
       i.safety_stock,
       i.updated_at
     FROM inventory i
     JOIN hospitals h ON h.id = i.hospital_id
     JOIN medicines m ON m.id = i.medicine_id
     ${where}
     ORDER BY i.id ASC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );

  return { rows: dataResult.rows, total };
}

module.exports = { findAll };
