'use strict';

const dataStore = require('../services/dataStore');
const { query } = require('../config/database');

/**
 * Find all inventory records with optional filters and pagination.
 */
async function findAll({ hospital_id, medicine_id, limit = 100, offset = 0 } = {}) {
  try {
    const res = dataStore.getInventory({ hospital_id, medicine_id, limit, offset });
    if (res && res.rows.length > 0) return res;
  } catch (err) {
    console.warn('[InventoryModel] dataStore warning, trying DB:', err.message);
  }

  try {
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
    const countResult = await query(`SELECT COUNT(*) AS total FROM inventory i ${where}`, values);
    const total = parseInt(countResult.rows[0].total, 10);

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
  } catch {
    return dataStore.getInventory({ hospital_id, medicine_id, limit, offset });
  }
}

async function findById(id) {
  const numId = parseInt(id, 10);
  const inv = dataStore.getInventory();
  const found = inv.rows.find((i) => i.id === numId);
  if (found) return found;

  try {
    const res = await query(
      `SELECT
         i.id,
         i.hospital_id,
         h.name AS hospital_name,
         i.medicine_id,
         m.name AS medicine_name,
         m.unit AS medicine_unit,
         i.quantity,
         i.safety_stock,
         i.updated_at
       FROM inventory i
       JOIN hospitals h ON h.id = i.hospital_id
       JOIN medicines m ON m.id = i.medicine_id
       WHERE i.id = $1`,
      [numId]
    );
    return res.rows[0] || null;
  } catch {
    return null;
  }
}

async function updateById(id, { quantity, safety_stock, note } = {}) {
  // Always update in memory store
  const updatedItem = dataStore.updateInventoryItem({ id, quantity, safety_stock, note });

  // Update in database if connected
  try {
    const fields = [];
    const values = [];

    if (quantity !== undefined) {
      values.push(parseFloat(quantity));
      fields.push(`quantity = $${values.length}`);
    }
    if (safety_stock !== undefined) {
      values.push(parseFloat(safety_stock));
      fields.push(`safety_stock = $${values.length}`);
    }
    if (fields.length > 0) {
      fields.push(`updated_at = NOW()`);
      values.push(parseInt(id, 10));
      const q = `UPDATE inventory SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`;
      await query(q, values);
    }
  } catch (err) {
    console.warn('[InventoryModel] DB update warning:', err.message);
  }

  return updatedItem;
}

module.exports = { findAll, findById, updateById };
