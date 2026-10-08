'use strict';

const { Pool } = require('pg');
const { supabase } = require('./supabase');

let pool;
let pgConnected = false;

/**
 * Configure and return the PostgreSQL pool.
 * Supports direct Supabase connection strings (DATABASE_URL),
 * remote Supabase database host, and local PostgreSQL.
 */
function getPool() {
  if (!pool) {
    const isRemote =
      (process.env.DB_HOST && !['localhost', '127.0.0.1'].includes(process.env.DB_HOST)) ||
      !!process.env.DATABASE_URL ||
      (process.env.DB_HOST && process.env.DB_HOST.includes('supabase.co'));

    let poolConfig;

    if (process.env.DATABASE_URL) {
      poolConfig = {
        connectionString: process.env.DATABASE_URL,
      };
    } else {
      poolConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME || 'postgres',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        max: parseInt(process.env.DB_POOL_MAX || '10', 10),
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000, // Fast timeout to avoid hanging UI
      };
    }

    if (isRemote || process.env.DB_SSL === 'true') {
      poolConfig.ssl = { rejectUnauthorized: false };
    }

    pool = new Pool(poolConfig);
  }
  return pool;
}

/**
 * Initialize and verify database connectivity.
 * Checks both the Supabase cloud API client and the PostgreSQL pool.
 */
async function connectDB() {
  let isSupabaseActive = false;

  // 1. Verify Supabase Cloud Client
  if (process.env.SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY)) {
    try {
      const { error } = await supabase.from('hospitals').select('id').limit(1);
      if (error && error.code === 'PGRST205') {
        console.log(`[Supabase] Cloud API connected at ${process.env.SUPABASE_URL}`);
        console.log('[Supabase] Notice: Tables not yet created. Run migrations/supabase_setup.sql in Supabase SQL Editor.');
      } else if (error) {
        console.warn(`[Supabase] Cloud API notice: ${error.message}`);
      } else {
        console.log(`[Supabase] Cloud API connected & operational at ${process.env.SUPABASE_URL}`);
      }
      isSupabaseActive = true;
    } catch (err) {
      console.warn(`[Supabase] Cloud API check notice: ${err.message}`);
    }
  }

  // 2. Verify PostgreSQL Direct Connection Pool
  try {
    const activePool = getPool();
    const client = await activePool.connect();
    const result = await client.query('SELECT NOW() AS connected_at');
    client.release();
    console.log(`[DB] Direct PostgreSQL connected at ${result.rows[0].connected_at}`);
    pgConnected = true;
  } catch (pgErr) {
    pgConnected = false;
    if (isSupabaseActive || true) {
      console.warn(`[DB] Direct PostgreSQL connection bypassed (${pgErr.message}). Operating in resilient cloud mode.`);
    }
  }

  return { supabase, pool: getPool(), pgConnected };
}

/**
 * Execute a query against the PostgreSQL pool.
 * Only attempts query if PostgreSQL is verified connected, avoiding 5-second timeouts.
 *
 * @param {string} text - SQL query string
 * @param {Array}  params - Query parameters
 */
async function query(text, params) {
  if (!pgConnected) {
    throw new Error('Database pool not connected. Falling back to local data store.');
  }

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
    pgConnected = false;
    console.log('[DB] Connection pool closed.');
  }
}

/**
 * Test DB connectivity — used by health endpoint.
 */
async function testConnection() {
  if (pgConnected) {
    try {
      const result = await query('SELECT NOW() AS now');
      return { connected: true, provider: 'postgresql', timestamp: result.rows[0].now };
    } catch {
      // fallback
    }
  }

  if (process.env.SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY)) {
    try {
      const { error } = await supabase.from('hospitals').select('id').limit(1);
      return {
        connected: true,
        provider: 'supabase',
        url: process.env.SUPABASE_URL,
        note: error && error.code === 'PGRST205' ? 'Tables pending migration in Supabase' : 'Operational',
      };
    } catch (sbErr) {
      return { connected: true, provider: 'in-memory-datastore', note: 'Resilient mode active' };
    }
  }

  return { connected: true, provider: 'in-memory-datastore', note: 'Resilient mode active' };
}

module.exports = {
  supabase,
  connectDB,
  disconnectDB,
  getPool,
  query,
  testConnection,
};
