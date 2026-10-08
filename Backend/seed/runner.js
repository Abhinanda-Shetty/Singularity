'use strict';

/**
 * Seed Runner
 *
 * Runs all seed scripts in order for development environment.
 * Usage: node seed/runner.js
 *
 * WARNING: Seeds are for development only. Do NOT run against production.
 */

require('dotenv').config();

const { getPool, disconnectDB } = require('../config/database');
const hospitalsSeeder = require('./seeders/hospitals');
const medicinesSeeder = require('./seeders/medicines');
const inventorySeeder = require('./seeders/inventory');
const batchesSeeder = require('./seeders/batches');
const demandHistorySeeder = require('./seeders/demandHistory');

const pool = getPool();

async function runSeeds() {
  const client = await pool.connect();
  try {
    console.log('[Seed] Starting seed run...');

    await hospitalsSeeder(client);
    await medicinesSeeder(client);
    await inventorySeeder(client);
    await batchesSeeder(client);
    await demandHistorySeeder(client);

    console.log('[Seed] All seeds completed successfully.');
  } catch (err) {
    console.error('[Seed] Seed failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

runSeeds().catch((err) => {
  console.error('[Seed] Fatal:', err.message);
  process.exit(1);
});
