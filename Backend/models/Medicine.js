'use strict';

const medicineDataset = require('../services/medicineDatasetService');
const { query } = require('../config/database');

/**
 * Find all medicines with search, category/critical filters, and pagination.
 * Directly integrates the Indian medicines dataset (Extensive_A_Z_medicines_dataset_of_India).
 *
 * @param {{ search?: string, category?: string, critical?: boolean, limit?: number, offset?: number }} options
 * @returns {Promise<{ rows: object[], total: number }>}
 */
async function findAll({ search, category, critical, limit = 20, offset = 0 } = {}) {
  // Try fast dataset service first (loaded from Extensive_A_Z_medicines_dataset_of_India)
  try {
    const result = medicineDataset.findAll({ search, category, critical, limit, offset });
    if (result && result.rows.length > 0) {
      return result;
    }
  } catch (err) {
    console.warn('[MedicineModel] Dataset service warning, trying database:', err.message);
  }

  // Fallback to database if available
  try {
    const values = [];
    const conditions = [];

    if (search) {
      values.push(`%${search.toLowerCase()}%`);
      conditions.push(`LOWER(name) LIKE $${values.length}`);
    }

    if (category) {
      values.push(category);
      conditions.push(`category = $${values.length}`);
    }

    if (critical !== undefined) {
      values.push(critical);
      conditions.push(`critical = $${values.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countResult = await query(`SELECT COUNT(*) AS total FROM medicines ${where}`, values);
    const total = parseInt(countResult.rows[0].total, 10);

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
  } catch (dbErr) {
    return medicineDataset.findAll({ search, category, critical, limit, offset });
  }
}

/**
 * Find a single medicine by ID.
 * @param {number} id
 * @returns {Promise<object|null>}
 */
async function findById(id) {
  const fromDataset = medicineDataset.findById(id);
  if (fromDataset) return fromDataset;

  try {
    const result = await query(
      `SELECT id, name, category, unit, critical, alternative_group, created_at, updated_at
       FROM medicines
       WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  } catch {
    return null;
  }
}

module.exports = { findAll, findById };
