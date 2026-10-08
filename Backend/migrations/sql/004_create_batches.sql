-- Migration: 004_create_batches.sql
-- Purpose: Individual physical medicine batches for expiry tracking
-- Created: Phase 1
-- Depends on: hospitals, medicines

CREATE TABLE IF NOT EXISTS batches (
    id            SERIAL PRIMARY KEY,
    hospital_id   INTEGER        NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    medicine_id   INTEGER        NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    quantity      NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    expiry_date   DATE           NOT NULL,
    created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Indexes
-- Note: expiry_date index covers all range queries (WHERE expiry_date > NOW(), etc.).
-- Partial index predicates cannot use NOW()/CURRENT_DATE (non-IMMUTABLE) in PostgreSQL.
-- Dynamic expiry filtering must be applied in SQL query WHERE clauses, not in index predicates.
CREATE INDEX IF NOT EXISTS idx_batches_expiry_date       ON batches (expiry_date);
CREATE INDEX IF NOT EXISTS idx_batches_hospital_id       ON batches (hospital_id);
CREATE INDEX IF NOT EXISTS idx_batches_hospital_medicine ON batches (hospital_id, medicine_id);
CREATE INDEX IF NOT EXISTS idx_batches_medicine_id       ON batches (medicine_id);

-- Auto-update updated_at trigger
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_batches_updated_at'
    ) THEN
        CREATE TRIGGER trg_batches_updated_at
        BEFORE UPDATE ON batches
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END;
$$;
