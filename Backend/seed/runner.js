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

const { Pool } = require('pg');
const hospitalsSeeder = require('./seeders/hospitals');
const medicinesSeeder = require('./seeders/medicines');
const inventorySeeder = require('./seeders/inventory');
const batchesSeeder = require('./seeders/batches');
const demandHistorySeeder = require('./seeders/demandHistory');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'singularity_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

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
