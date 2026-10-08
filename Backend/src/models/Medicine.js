'use strict';

const { query } = require('../config/database');

/**
 * Medicine Model — raw SQL query layer.
 */

/**
 * Find all medicines with optional filters and pagination.
 * @param {{ category?: string, critical?: boolean, limit: number, offset: number }} options
 * @returns {{ rows: object[], total: number }}
 */
async function findAll({ category, critical, limit, offset }) {
  const values = [];
  const conditions = [];

  if (category) {
    values.push(category);
    conditions.push(`category = $${values.length}`);
  }

  if (critical !== undefined) {
    values.push(critical);
    conditions.push(`critical = $${values.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  // Count query
  const countResult = await query(
    `SELECT COUNT(*) AS total FROM medicines ${where}`,
    values
  );
  const total = parseInt(countResult.rows[0].total, 10);

  // Data query
  values.push(limit);
  values.push(offset);
  const dataResult = await query(
    `SELECT id, name, category, unit, critical, alternative_group, created_at, updated_at
     FROM medicines
     ${where}
     ORDER BY id ASC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );

  return { rows: dataResult.rows, total };
}

/**
 * Find a single medicine by ID.
 * @param {number} id
 * @returns {object|null}
 */
async function findById(id) {
  const result = await query(
    `SELECT id, name, category, unit, critical, alternative_group, created_at, updated_at
     FROM medicines
     WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

module.exports = { findAll, findById };
