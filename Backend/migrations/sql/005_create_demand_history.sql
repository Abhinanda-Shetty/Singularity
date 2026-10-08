-- Migration: 005_create_demand_history.sql
-- Purpose: Daily consumption records per hospital per medicine, used for AI forecasting
-- Created: Phase 1
-- Depends on: hospitals, medicines

CREATE TABLE IF NOT EXISTS demand_history (
    id               SERIAL PRIMARY KEY,
    hospital_id      INTEGER        NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    medicine_id      INTEGER        NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    date             DATE           NOT NULL,
    consumption      NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (consumption >= 0),
    patient_load     INTEGER        NOT NULL DEFAULT 0 CHECK (patient_load >= 0),
    emergency_demand NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (emergency_demand >= 0),
    created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    -- One record per hospital, medicine, and date
    CONSTRAINT uq_demand_hospital_medicine_date UNIQUE (hospital_id, medicine_id, date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_demand_date                     ON demand_history (date DESC);
CREATE INDEX IF NOT EXISTS idx_demand_hospital_id              ON demand_history (hospital_id);
CREATE INDEX IF NOT EXISTS idx_demand_medicine_id              ON demand_history (medicine_id);
CREATE INDEX IF NOT EXISTS idx_demand_hospital_medicine_date   ON demand_history (hospital_id, medicine_id, date DESC);
