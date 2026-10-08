'use strict';

const { query } = require('../config/database');

/**
 * Hospital Model — raw SQL query layer.
 * No ORM. All queries go through pg pool via query().
 */

/**
 * Find all hospitals with optional type filter and pagination.
 * @param {{ type?: string, limit: number, offset: number }} options
 * @returns {{ rows: object[], total: number }}
 */
async function findAll({ type, limit, offset }) {
  const values = [];
  const conditions = [];

  if (type) {
    values.push(type);
    conditions.push(`type = $${values.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  // Count query
  const countResult = await query(
    `SELECT COUNT(*) AS total FROM hospitals ${where}`,
    values
  );
  const total = parseInt(countResult.rows[0].total, 10);

  // Data query
  values.push(limit);
  values.push(offset);
  const dataResult = await query(
    `SELECT id, name, type, address, latitude, longitude, patient_capacity, created_at, updated_at
     FROM hospitals
     ${where}
     ORDER BY id ASC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );

  return { rows: dataResult.rows, total };
}

/**
 * Find a single hospital by ID.
 * @param {number} id
 * @returns {object|null}
 */
async function findById(id) {
  const result = await query(
    `SELECT id, name, type, address, latitude, longitude, patient_capacity, created_at, updated_at
     FROM hospitals
     WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

module.exports = { findAll, findById };
