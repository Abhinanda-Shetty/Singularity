'use strict';

const { getPool } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/responseHelpers');
const AppError = require('../utils/AppError');

/**
 * POST /api/entries
 * Handles two entry types determined by req.body.type:
 *   "stock"  — record stock received → upsert batch, update inventory
 *   "usage"  — record daily usage  → update inventory, insert demand_history
 *
 * Both operations run inside a single PostgreSQL transaction.
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
    hospital_id = 1,   // defaults to hospital 1 for prototype
  } = req.body;

  // Validate required fields
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

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Verify medicine exists
    const medResult = await client.query(
      'SELECT id, name FROM medicines WHERE id = $1',
      [medicine_id]
    );
    if (medResult.rows.length === 0) {
      throw new AppError(`Medicine with id ${medicine_id} not found.`, 404, 'NOT_FOUND');
    }
    const medicine = medResult.rows[0];

    // 2. Verify (or create) inventory row for this hospital+medicine
    const invResult = await client.query(
      `INSERT INTO inventory (hospital_id, medicine_id, quantity, safety_stock)
       VALUES ($1, $2, 0, 200)
       ON CONFLICT (hospital_id, medicine_id) DO NOTHING
       RETURNING id`,
      [hospital_id, medicine_id]
    );

    // 3. Upsert batch record
    await client.query(
      `INSERT INTO batches (hospital_id, medicine_id, quantity, expiry_date)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING`,
      [hospital_id, medicine_id, qty, expiry_date]
    );

    // 4. Update inventory quantity (increase)
    const updatedInv = await client.query(
      `UPDATE inventory
       SET quantity = quantity + $1,
           updated_at = NOW()
       WHERE hospital_id = $2 AND medicine_id = $3
       RETURNING id, quantity`,
      [qty, hospital_id, medicine_id]
    );

    // 5. Record in activity log
    await client.query(
      `INSERT INTO activity_log
         (hospital_id, medicine_id, type, quantity, batch_id, description)
       VALUES ($1, $2, 'stock_received', $3, $4, $5)`,
      [
        hospital_id,
        medicine_id,
        qty,
        batch_id,
        `Stock received: +${qty} ${medicine.name} | Batch: ${batch_id} | Expires: ${expiry_date}`,
      ]
    );

    await client.query('COMMIT');

    const updatedQuantity = updatedInv.rows[0]?.quantity ?? qty;

    return res.status(201).json(
      successResponse(
        {
          type: 'stock',
          medicine_id: parseInt(medicine_id, 10),
          medicine_name: medicine.name,
          batch_id,
          quantity_added: qty,
          expiry_date,
          updated_inventory_quantity: parseFloat(updatedQuantity),
        },
        `Stock received: +${qty} units of ${medicine.name} added to inventory.`
      )
    );
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
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

  // Validate required fields
  if (!medicine_id || !units_used || !date) {
    throw new AppError(
      'medicine_id, units_used, and date are required.',
      400,
      'VALIDATION_ERROR'
    );
  }
  const used = parseFloat(units_used);
  if (isNaN(used) || used <= 0) {
    throw new AppError('units_used must be a positive number.', 400, 'VALIDATION_ERROR');
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Verify medicine exists
    const medResult = await client.query(
      'SELECT id, name FROM medicines WHERE id = $1',
      [medicine_id]
    );
    if (medResult.rows.length === 0) {
      throw new AppError(`Medicine with id ${medicine_id} not found.`, 404, 'NOT_FOUND');
    }
    const medicine = medResult.rows[0];

    // 2. Check current inventory (prevent negative stock)
    const invResult = await client.query(
      'SELECT id, quantity FROM inventory WHERE hospital_id = $1 AND medicine_id = $2',
      [hospital_id, medicine_id]
    );
    if (invResult.rows.length === 0) {
      throw new AppError(
        `No inventory record found for medicine ${medicine_id} at hospital ${hospital_id}.`,
        404,
        'NOT_FOUND'
      );
    }
    const currentQty = parseFloat(invResult.rows[0].quantity);
    if (used > currentQty) {
      throw new AppError(
        `Cannot record ${used} units used — only ${currentQty} units available in inventory.`,
        400,
        'INSUFFICIENT_STOCK'
      );
    }

    // 3. Decrease inventory
    const updatedInv = await client.query(
      `UPDATE inventory
       SET quantity = quantity - $1,
           updated_at = NOW()
       WHERE hospital_id = $2 AND medicine_id = $3
       RETURNING id, quantity`,
      [used, hospital_id, medicine_id]
    );

    // 4. Upsert demand_history record (one row per hospital/medicine/date)
    await client.query(
      `INSERT INTO demand_history (hospital_id, medicine_id, date, consumption, patient_load, emergency_demand)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (hospital_id, medicine_id, date)
       DO UPDATE SET
         consumption = demand_history.consumption + EXCLUDED.consumption,
         patient_load = GREATEST(demand_history.patient_load, EXCLUDED.patient_load),
         emergency_demand = demand_history.emergency_demand + EXCLUDED.emergency_demand`,
      [hospital_id, medicine_id, date, used, parseInt(patient_load, 10), parseFloat(emergency_cases)]
    );

    // 5. Record in activity log
    await client.query(
      `INSERT INTO activity_log
         (hospital_id, medicine_id, type, quantity, description)
       VALUES ($1, $2, 'usage', $3, $4)`,
      [
        hospital_id,
        medicine_id,
        used,
        `Daily usage: -${used} ${medicine.name} | Date: ${date} | Emergency: ${emergency_cases}`,
      ]
    );

    await client.query('COMMIT');

    const updatedQuantity = parseFloat(updatedInv.rows[0]?.quantity ?? 0);

    return res.status(201).json(
      successResponse(
        {
          type: 'usage',
          medicine_id: parseInt(medicine_id, 10),
          medicine_name: medicine.name,
          units_used: used,
          date,
          updated_inventory_quantity: updatedQuantity,
          demand_history_recorded: true,
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
}

/**
 * GET /api/entries/recent
 * Returns recent activity log entries for a given hospital.
 */
const getRecentEntries = asyncHandler(async (req, res) => {
  const hospital_id = parseInt(req.query.hospital_id || '1', 10);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20', 10)));

  const { query } = require('../config/database');

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

  // Shape for frontend UI
  const data = result.rows.map((row) => {
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
      title: row.medicine_name,
      medicine_name: row.medicine_name,
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
