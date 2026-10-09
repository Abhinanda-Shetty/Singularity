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

/**
 * Create a new hospital (in DB and dataStore)
 */

async function create({ name, type = 'general', address = 'India', latitude, longitude, patient_capacity = 300 }) {
  let created = null;

  try {
    const values = [
      name.trim(),
      (type || 'general').toLowerCase(),
      address || 'India Regional Healthcare Center',
      latitude || 20.0,
      longitude || 78.0,
      parseInt(patient_capacity, 10) || 300,
    ];
    const result = await query(
      `INSERT INTO hospitals (name, type, address, latitude, longitude, patient_capacity)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, type, address, latitude, longitude, patient_capacity, created_at, updated_at`,
      values
    );
    if (result.rows && result.rows.length > 0) {
      created = result.rows[0];
    }
  } catch (err) {
    console.warn('[HospitalModel] DB insert failed, using dataStore:', err.message);
  }

  // Also ensure dataStore is updated
  const fromStore = dataStore.createHospital({
    name,
    type,
    address,
    latitude,
    longitude,
    patient_capacity,
  });

  return created || fromStore;
}

module.exports = { findAll, findById, create };

