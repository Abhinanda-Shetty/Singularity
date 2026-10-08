-- Migration: 006_create_requests.sql
-- Purpose: Medicine supply requests submitted by hospitals
-- Created: Pre-AI Phase
-- Depends on: hospitals, medicines

CREATE TABLE IF NOT EXISTS requests (
    id               SERIAL PRIMARY KEY,
    hospital_id      INTEGER        NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    medicine_id      INTEGER        NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    quantity_required NUMERIC(12, 2) NOT NULL CHECK (quantity_required > 0),
    needed_by        DATE           NOT NULL,
    urgency          VARCHAR(20)    NOT NULL DEFAULT 'Normal'
                       CHECK (urgency IN ('Normal', 'Urgent', 'Critical')),
    status           VARCHAR(20)    NOT NULL DEFAULT 'Pending'
                       CHECK (status IN ('Pending', 'Fulfilled', 'Cancelled')),
    notes            TEXT,
    created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_requests_hospital_id  ON requests (hospital_id);
CREATE INDEX IF NOT EXISTS idx_requests_medicine_id  ON requests (medicine_id);
CREATE INDEX IF NOT EXISTS idx_requests_status       ON requests (status);
CREATE INDEX IF NOT EXISTS idx_requests_created_at   ON requests (created_at DESC);

-- Auto-update updated_at trigger
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_requests_updated_at'
    ) THEN
        CREATE TRIGGER trg_requests_updated_at
        BEFORE UPDATE ON requests
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END;
$$;
