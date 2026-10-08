'use strict';

const dataStore = require('../services/dataStore');
const { query } = require('../config/database');

/**
 * Find all hospitals with optional type filter and pagination.
 */
async function findAll({ type, limit = 20, offset = 0 } = {}) {
  try {
    const res = dataStore.getHospitals({ type, limit, offset });
    if (res && res.rows.length > 0) return res;
  } catch (err) {
    console.warn('[HospitalModel] dataStore warning, trying DB:', err.message);
  }

  try {
    const values = [];
    const conditions = [];
    if (type) {
      values.push(type);
      conditions.push(`type = $${values.length}`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countResult = await query(`SELECT COUNT(*) AS total FROM hospitals ${where}`, values);
    const total = parseInt(countResult.rows[0].total, 10);

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
  } catch {
    return dataStore.getHospitals({ type, limit, offset });
  }
}

/**
 * Find a single hospital by ID.
 */
async function findById(id) {
  const fromStore = dataStore.getHospitalById(id);
  if (fromStore) return fromStore;

  try {
    const result = await query(
      `SELECT id, name, type, address, latitude, longitude, patient_capacity, created_at, updated_at
       FROM hospitals
       WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  } catch {
    return null;
  }
}

module.exports = { findAll, findById };
