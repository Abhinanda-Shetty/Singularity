'use strict';

/**
 * Migration Runner
 *
 * Applies SQL migration files in order.
 * Tracks applied migrations in a `schema_migrations` table.
 *
 * Usage: node migrations/runner.js
 *
 * Run order: Files must be named NNN_description.sql (e.g. 001_create_hospitals.sql)
 * Only runs migrations that have NOT been recorded in schema_migrations.
 */

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { getPool, disconnectDB } = require('../config/database');
const pool = getPool();

const MIGRATIONS_DIR = path.join(__dirname, 'sql');

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id         SERIAL PRIMARY KEY,
      filename   VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

async function getAppliedMigrations(client) {
  const result = await client.query(
    'SELECT filename FROM schema_migrations ORDER BY filename ASC'
  );
  return new Set(result.rows.map((r) => r.filename));
}

async function runMigrations() {
  const client = await pool.connect();
  try {
    await ensureMigrationsTable(client);
    const applied = await getAppliedMigrations(client);

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    let ran = 0;
    for (const file of files) {
      if (applied.has(file)) {
        console.log(`[Migration] SKIP  ${file} (already applied)`);
        continue;
      }

      const sqlPath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(sqlPath, 'utf8');

      console.log(`[Migration] RUN   ${file}`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`[Migration] DONE  ${file}`);
        ran++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[Migration] FAIL  ${file}: ${err.message}`);
        throw err;
      }
    }

    if (ran === 0) {
      console.log('[Migration] All migrations already applied. Nothing to do.');
    } else {
      console.log(`[Migration] Successfully applied ${ran} migration(s).`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch((err) => {
  console.error('[Migration] Fatal error:', err.message);
  process.exit(1);
});
