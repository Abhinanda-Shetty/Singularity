-- Migration: 001_create_hospitals.sql
-- Purpose: Master registry of all hospitals in the network
-- Created: Phase 1

CREATE TABLE IF NOT EXISTS hospitals (
    id               SERIAL PRIMARY KEY,
    name             VARCHAR(255) NOT NULL,
    type             VARCHAR(100) NOT NULL,                -- e.g. 'general', 'specialty', 'rural', 'urban'
    address          TEXT,
    latitude         NUMERIC(10, 7),
    longitude        NUMERIC(10, 7),
    patient_capacity INTEGER NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hospitals_name     ON hospitals (name);
CREATE INDEX IF NOT EXISTS idx_hospitals_type     ON hospitals (type);
CREATE INDEX IF NOT EXISTS idx_hospitals_location ON hospitals (latitude, longitude);

-- Trigger to auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_hospitals_updated_at'
    ) THEN
        CREATE TRIGGER trg_hospitals_updated_at
        BEFORE UPDATE ON hospitals
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END;
$$;
