'use strict';

const dataStore = require('../services/dataStore');
const medicineDataset = require('../services/medicineDatasetService');
const { getPool, query } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/responseHelpers');
const AppError = require('../utils/AppError');

/**
 * POST /api/entries
 * Handles two entry types:
 *   "stock"  — record stock received
 *   "usage"  — record daily usage
 */
const createEntry = asyncHandler(async (req, res) => {
  const { type } = req.body;

  if (type === 'stock') {
    return handleStockReceived(req, res);
  } else if (type === 'usage') {
    return handleDailyUsage(req, res);
  } else {
    throw new AppError('Entry type must be "stock" or "usage".', 400, 'VALIDATION_ERROR');
  }
});

// ─────────────────────────────────────────────────────────────────
// Stock Received
// ─────────────────────────────────────────────────────────────────
async function handleStockReceived(req, res) {
  const {
    medicine_id,
    batch_id,
    quantity,
    expiry_date,
    date_received,
    hospital_id = 1,
  } = req.body;

  if (!medicine_id || !batch_id || !quantity || !expiry_date) {
    throw new AppError(
      'medicine_id, batch_id, quantity, and expiry_date are required.',
      400,
      'VALIDATION_ERROR'
    );
  }
  const qty = parseFloat(quantity);
  if (isNaN(qty) || qty <= 0) {
    throw new AppError('quantity must be a positive number.', 400, 'VALIDATION_ERROR');
  }

  const medicine = medicineDataset.findById(medicine_id) || { name: `Medicine #${medicine_id}` };

  // Try DB
  try {
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Upsert inventory
      const invResult = await client.query(
        `INSERT INTO inventory (hospital_id, medicine_id, quantity, safety_stock)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (hospital_id, medicine_id)
         DO UPDATE SET quantity = inventory.quantity + EXCLUDED.quantity, updated_at = NOW()
         RETURNING quantity, safety_stock`,
        [hospital_id, medicine_id, qty, Math.round(qty * 0.2)]
      );

      // Insert batch
      await client.query(
        `INSERT INTO batches (hospital_id, medicine_id, quantity, expiry_date)
         VALUES ($1, $2, $3, $4)`,
        [hospital_id, medicine_id, qty, expiry_date]
      );

      // Activity log
      await client.query(
        `INSERT INTO activity_log (hospital_id, medicine_id, type, quantity, batch_id, description)
         VALUES ($1, $2, 'stock_received', $3, $4, $5)`,
        [hospital_id, medicine_id, qty, batch_id, `Stock received: ${qty} units of ${medicine.name}`]
      );

      await client.query('COMMIT');

      return res.status(201).json(
        successResponse(
          {
            type: 'stock',
            medicine_id,
            medicine_name: medicine.name,
            batch_id,
            quantity_added: qty,
            new_total_stock: parseFloat(invResult.rows[0].quantity),
            expiry_date,
          },
          `Stock received: +${qty} units of ${medicine.name}.`
        )
      );
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    // Graceful fallback to dataStore
    const result = dataStore.recordStockReceived({
      hospital_id,
      medicine_id,
      batch_id,
      quantity: qty,
      expiry_date,
      date_received,
    });

    return res.status(201).json(
      successResponse(
        {
          type: 'stock',
          medicine_id,
          medicine_name: medicine.name,
          batch_id,
          quantity_added: qty,
          new_total_stock: result.inventory.quantity,
          expiry_date,
        },
        `Stock received: +${qty} units of ${medicine.name}.`
      )
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// Daily Usage
// ─────────────────────────────────────────────────────────────────
async function handleDailyUsage(req, res) {
  const {
    medicine_id,
    units_used,
    date,
    emergency_cases = 0,
    patient_load = 0,
    hospital_id = 1,
  } = req.body;

  if (!medicine_id || units_used === undefined) {
    throw new AppError('medicine_id and units_used are required.', 400, 'VALIDATION_ERROR');
  }
  const used = parseFloat(units_used);
  if (isNaN(used) || used <= 0) {
    throw new AppError('units_used must be a positive number.', 400, 'VALIDATION_ERROR');
  }

  const medicine = medicineDataset.findById(medicine_id) || { name: `Medicine #${medicine_id}` };

  // Try DB
  try {
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const invResult = await client.query(
        `UPDATE inventory
         SET quantity = GREATEST(0, quantity - $1), updated_at = NOW()
         WHERE hospital_id = $2 AND medicine_id = $3
         RETURNING quantity`,
        [used, hospital_id, medicine_id]
      );

      const usageDate = date || new Date().toISOString().split('T')[0];
      await client.query(
        `INSERT INTO demand_history (hospital_id, medicine_id, date, consumption, patient_load, emergency_demand)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (hospital_id, medicine_id, date)
         DO UPDATE SET consumption = demand_history.consumption + EXCLUDED.consumption`,
        [hospital_id, medicine_id, usageDate, used, patient_load, emergency_cases]
      );

      await client.query(
        `INSERT INTO activity_log (hospital_id, medicine_id, type, quantity, description)
         VALUES ($1, $2, 'usage', $3, $4)`,
        [hospital_id, medicine_id, used, `Daily usage recorded: ${used} units of ${medicine.name}`]
      );

      await client.query('COMMIT');

      return res.status(201).json(
        successResponse(
          {
            type: 'usage',
            medicine_id,
            medicine_name: medicine.name,
            units_used: used,
            remaining_stock: invResult.rows.length ? parseFloat(invResult.rows[0].quantity) : 0,
            date: usageDate,
          },
          `Daily usage recorded: -${used} units of ${medicine.name}.`
        )
      );
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    // Graceful fallback to dataStore
    const result = dataStore.recordDailyUsage({
      hospital_id,
      medicine_id,
      units_used: used,
      date,
      emergency_cases,
      patient_load,
    });

    return res.status(201).json(
      successResponse(
        {
          type: 'usage',
          medicine_id,
          medicine_name: medicine.name,
          units_used: used,
          remaining_stock: result.inventory.quantity,
          date: result.demand.date,
        },
        `Daily usage recorded: -${used} units of ${medicine.name}.`
      )
    );
  }
}

/**
 * GET /api/entries/recent
 */
const getRecentEntries = asyncHandler(async (req, res) => {
  const hospital_id = parseInt(req.query.hospital_id || '1', 10);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20', 10)));

  let rawRows = [];

  try {
    const result = await query(
      `SELECT
         a.id,
         a.type,
         m.name AS medicine_name,
         m.unit AS medicine_unit,
         a.quantity,
         a.batch_id,
         a.description,
         a.created_at
       FROM activity_log a
       JOIN medicines m ON m.id = a.medicine_id
       WHERE a.hospital_id = $1
       ORDER BY a.created_at DESC
       LIMIT $2`,
      [hospital_id, limit]
    );
    if (result && result.rows) {
      rawRows = result.rows;
    }
  } catch {
    rawRows = dataStore.getRecentEntries({ hospital_id, limit });
  }

  // Format for UI
  const data = rawRows.map((row) => {
    let pillType = 'received';
    let pillText = '';
    let subtitle = row.description || '';

    if (row.type === 'stock_received') {
      pillType = 'received';
      pillText = `+${parseFloat(row.quantity).toLocaleString()} units received`;
      subtitle = row.batch_id ? `Batch #${row.batch_id}` : 'Stock received';
    } else if (row.type === 'usage') {
      pillType = 'used';
      pillText = `-${parseFloat(row.quantity).toLocaleString()} units used`;
      subtitle = 'Daily usage recorded';
    } else if (row.type === 'request') {
      pillType = 'urgent';
      pillText = `${parseFloat(row.quantity).toLocaleString()} units requested`;
      subtitle = 'Medicine request submitted';
    }

    return {
      id: row.id,
      type: row.type,
      title: row.medicine_name || `Medicine #${row.medicine_id}`,
      medicine_name: row.medicine_name || `Medicine #${row.medicine_id}`,
      quantity: parseFloat(row.quantity),
      timestamp: row.created_at,
      time: formatRelativeTime(row.created_at),
      pillText,
      pillType,
      subtitle,
    };
  });

  return res.status(200).json(
    successResponse(data, null, { total: data.length, hospital_id })
  );
});

function formatRelativeTime(timestamp) {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffDay === 1) return 'Yesterday';
  return `${diffDay} days ago`;
}

module.exports = { createEntry, getRecentEntries };
