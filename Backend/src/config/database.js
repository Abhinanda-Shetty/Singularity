'use strict';

const { Pool } = require('pg');

let pool;

/**
 * Initialize the PostgreSQL connection pool.
 * Called once at server startup.
 */
async function connectDB() {
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'singularity_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  // Test connectivity
  const client = await pool.connect();
  const result = await client.query('SELECT NOW() AS connected_at');
  client.release();

  console.log(`[DB] PostgreSQL connected at ${result.rows[0].connected_at}`);
  return pool;
}

/**
 * Returns the active pool instance.
 * Throws if connectDB() was not called first.
 */
function getPool() {
  if (!pool) {
    throw new Error('Database pool not initialized. Call connectDB() first.');
  }
  return pool;
}

/**
 * Execute a query against the pool.
 * @param {string} text - SQL query string
 * @param {Array}  params - Query parameters
 */
async function query(text, params) {
  const client = getPool();
  const start = Date.now();
  const result = await client.query(text, params);
  const duration = Date.now() - start;

  if (process.env.NODE_ENV === 'development') {
    console.log(`[DB] Query executed in ${duration}ms | rows: ${result.rowCount}`);
  }

  return result;
}

/**
 * Close the pool gracefully.
 */
async function disconnectDB() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('[DB] Connection pool closed.');
  }
}

/**
 * Test DB connectivity — used by health endpoint.
 */
async function testConnection() {
  try {
    const result = await query('SELECT NOW() AS now');
    return { connected: true, timestamp: result.rows[0].now };
  } catch (err) {
    return { connected: false, error: err.message };
  }
}

module.exports = { connectDB, disconnectDB, getPool, query, testConnection };
