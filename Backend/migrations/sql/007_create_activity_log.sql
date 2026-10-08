-- Migration: 007_create_activity_log.sql
-- Purpose: Audit trail for stock received and daily usage entries
-- Created: Pre-AI Phase
-- Depends on: hospitals, medicines

CREATE TABLE IF NOT EXISTS activity_log (
    id           SERIAL PRIMARY KEY,
    hospital_id  INTEGER        NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    medicine_id  INTEGER        NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    type         VARCHAR(20)    NOT NULL CHECK (type IN ('stock_received', 'usage', 'request')),
    quantity     NUMERIC(12, 2) NOT NULL DEFAULT 0,
    batch_id     VARCHAR(50),
    description  TEXT,
    metadata     JSONB,
    created_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_activity_hospital_id  ON activity_log (hospital_id);
CREATE INDEX IF NOT EXISTS idx_activity_medicine_id  ON activity_log (medicine_id);
CREATE INDEX IF NOT EXISTS idx_activity_created_at   ON activity_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_type         ON activity_log (type);
