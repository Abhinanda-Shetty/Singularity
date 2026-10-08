-- Migration: 003_create_inventory.sql
-- Purpose: Current stock level per hospital per medicine
-- Created: Phase 1
-- Depends on: hospitals, medicines

CREATE TABLE IF NOT EXISTS inventory (
    id            SERIAL PRIMARY KEY,
    hospital_id   INTEGER      NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    medicine_id   INTEGER      NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    quantity      NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    safety_stock  NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (safety_stock >= 0),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    -- Each hospital+medicine pair is unique
    CONSTRAINT uq_inventory_hospital_medicine UNIQUE (hospital_id, medicine_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inventory_hospital_id  ON inventory (hospital_id);
CREATE INDEX IF NOT EXISTS idx_inventory_medicine_id  ON inventory (medicine_id);
CREATE INDEX IF NOT EXISTS idx_inventory_quantity     ON inventory (quantity);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_inventory_updated_at'
    ) THEN
        CREATE TRIGGER trg_inventory_updated_at
        BEFORE UPDATE ON inventory
        FOR EACH ROW EXECUTE FUNCTION update_inventory_updated_at();
    END IF;
END;
$$;
