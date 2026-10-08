-- Migration: 002_create_medicines.sql
-- Purpose: Master catalog of all medicines in the system
-- Created: Phase 1

CREATE TABLE IF NOT EXISTS medicines (
    id                  SERIAL PRIMARY KEY,
    name                VARCHAR(255) NOT NULL,
    category            VARCHAR(100) NOT NULL,    -- e.g. 'antibiotic', 'analgesic', 'cardiac'
    unit                VARCHAR(50)  NOT NULL,    -- e.g. 'tablet', 'vial', 'ml', 'mg'
    critical            BOOLEAN      NOT NULL DEFAULT FALSE,  -- TRUE = life-critical medicine
    alternative_group   VARCHAR(100),             -- group name for interchangeable alternatives
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_medicines_name              ON medicines (name);
CREATE INDEX IF NOT EXISTS idx_medicines_category          ON medicines (category);
CREATE INDEX IF NOT EXISTS idx_medicines_critical          ON medicines (critical);
CREATE INDEX IF NOT EXISTS idx_medicines_alternative_group ON medicines (alternative_group)
    WHERE alternative_group IS NOT NULL;

-- Auto-update updated_at trigger (reuses function from migration 001)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_medicines_updated_at'
    ) THEN
        CREATE TRIGGER trg_medicines_updated_at
        BEFORE UPDATE ON medicines
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END;
$$;
