-- ==============================================================================
-- Singularity / MedSupply Intelligence Platform
-- Supabase Cloud Database Setup & Schema Migration Script
-- ==============================================================================
-- Run this script in the Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. UTILITY FUNCTIONS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. HOSPITALS TABLE
CREATE TABLE IF NOT EXISTS hospitals (
    id               SERIAL PRIMARY KEY,
    name             VARCHAR(255) NOT NULL,
    type             VARCHAR(100) NOT NULL,
    address          TEXT,
    latitude         NUMERIC(10, 7),
    longitude        NUMERIC(10, 7),
    patient_capacity INTEGER NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hospitals_name     ON hospitals (name);
CREATE INDEX IF NOT EXISTS idx_hospitals_type     ON hospitals (type);
CREATE INDEX IF NOT EXISTS idx_hospitals_location ON hospitals (latitude, longitude);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_hospitals_updated_at') THEN
        CREATE TRIGGER trg_hospitals_updated_at
        BEFORE UPDATE ON hospitals
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END;
$$;

-- 3. MEDICINES TABLE
CREATE TABLE IF NOT EXISTS medicines (
    id                  SERIAL PRIMARY KEY,
    name                VARCHAR(255) NOT NULL,
    category            VARCHAR(100) NOT NULL,
    unit                VARCHAR(50)  NOT NULL,
    critical            BOOLEAN      NOT NULL DEFAULT FALSE,
    alternative_group   VARCHAR(100),
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medicines_name              ON medicines (name);
CREATE INDEX IF NOT EXISTS idx_medicines_category          ON medicines (category);
CREATE INDEX IF NOT EXISTS idx_medicines_critical          ON medicines (critical);
CREATE INDEX IF NOT EXISTS idx_medicines_alternative_group ON medicines (alternative_group)
    WHERE alternative_group IS NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_medicines_updated_at') THEN
        CREATE TRIGGER trg_medicines_updated_at
        BEFORE UPDATE ON medicines
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END;
$$;

-- 4. INVENTORY TABLE
CREATE TABLE IF NOT EXISTS inventory (
    id            SERIAL PRIMARY KEY,
    hospital_id   INTEGER        NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    medicine_id   INTEGER        NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    quantity      NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    safety_stock  NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (safety_stock >= 0),
    updated_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_inventory_hospital_medicine UNIQUE (hospital_id, medicine_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_hospital_id  ON inventory (hospital_id);
CREATE INDEX IF NOT EXISTS idx_inventory_medicine_id  ON inventory (medicine_id);
CREATE INDEX IF NOT EXISTS idx_inventory_quantity     ON inventory (quantity);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_inventory_updated_at') THEN
        CREATE TRIGGER trg_inventory_updated_at
        BEFORE UPDATE ON inventory
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END;
$$;

-- 5. BATCHES TABLE
CREATE TABLE IF NOT EXISTS batches (
    id            SERIAL PRIMARY KEY,
    hospital_id   INTEGER        NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    medicine_id   INTEGER        NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    quantity      NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    expiry_date   DATE           NOT NULL,
    created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_batches_expiry_date       ON batches (expiry_date);
CREATE INDEX IF NOT EXISTS idx_batches_hospital_id       ON batches (hospital_id);
CREATE INDEX IF NOT EXISTS idx_batches_hospital_medicine ON batches (hospital_id, medicine_id);
CREATE INDEX IF NOT EXISTS idx_batches_medicine_id       ON batches (medicine_id);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_batches_updated_at') THEN
        CREATE TRIGGER trg_batches_updated_at
        BEFORE UPDATE ON batches
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END;
$$;

-- 6. DEMAND HISTORY TABLE
CREATE TABLE IF NOT EXISTS demand_history (
    id               SERIAL PRIMARY KEY,
    hospital_id      INTEGER        NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    medicine_id      INTEGER        NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    date             DATE           NOT NULL,
    consumption      NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (consumption >= 0),
    patient_load     INTEGER        NOT NULL DEFAULT 0 CHECK (patient_load >= 0),
    emergency_demand NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (emergency_demand >= 0),
    created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_demand_hospital_medicine_date UNIQUE (hospital_id, medicine_id, date)
);

CREATE INDEX IF NOT EXISTS idx_demand_date                   ON demand_history (date DESC);
CREATE INDEX IF NOT EXISTS idx_demand_hospital_id            ON demand_history (hospital_id);
CREATE INDEX IF NOT EXISTS idx_demand_medicine_id            ON demand_history (medicine_id);
CREATE INDEX IF NOT EXISTS idx_demand_hospital_medicine_date ON demand_history (hospital_id, medicine_id, date DESC);

-- 7. REQUESTS TABLE
CREATE TABLE IF NOT EXISTS requests (
    id                SERIAL PRIMARY KEY,
    hospital_id       INTEGER        NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    medicine_id       INTEGER        NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    quantity_required NUMERIC(12, 2) NOT NULL CHECK (quantity_required > 0),
    needed_by         DATE           NOT NULL,
    urgency           VARCHAR(20)    NOT NULL DEFAULT 'Normal' CHECK (urgency IN ('Normal', 'Urgent', 'Critical')),
    status            VARCHAR(20)    NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Fulfilled', 'Cancelled')),
    notes             TEXT,
    created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_requests_hospital_id  ON requests (hospital_id);
CREATE INDEX IF NOT EXISTS idx_requests_medicine_id  ON requests (medicine_id);
CREATE INDEX IF NOT EXISTS idx_requests_status       ON requests (status);
CREATE INDEX IF NOT EXISTS idx_requests_created_at   ON requests (created_at DESC);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_requests_updated_at') THEN
        CREATE TRIGGER trg_requests_updated_at
        BEFORE UPDATE ON requests
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END;
$$;

-- 8. ACTIVITY LOG TABLE
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

CREATE INDEX IF NOT EXISTS idx_activity_hospital_id  ON activity_log (hospital_id);
CREATE INDEX IF NOT EXISTS idx_activity_medicine_id  ON activity_log (medicine_id);
CREATE INDEX IF NOT EXISTS idx_activity_created_at   ON activity_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_type         ON activity_log (type);

-- 9. USERS TABLE (Dynamic Cloud Auth)
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(100) UNIQUE NOT NULL,
    email         VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(50)  NOT NULL DEFAULT 'hospital_admin',
    hospital_id   INTEGER REFERENCES hospitals(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_users_email    ON users (email);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_users_updated_at') THEN
        CREATE TRIGGER trg_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END;
$$;

-- 10. SCHEMA MIGRATIONS TABLE
CREATE TABLE IF NOT EXISTS schema_migrations (
    id         SERIAL PRIMARY KEY,
    filename   VARCHAR(255) UNIQUE NOT NULL,
    applied_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO schema_migrations (filename) VALUES
    ('001_create_hospitals.sql'),
    ('002_create_medicines.sql'),
    ('003_create_inventory.sql'),
    ('004_create_batches.sql'),
    ('005_create_demand_history.sql'),
    ('006_create_requests.sql'),
    ('007_create_activity_log.sql'),
    ('008_create_users.sql')
ON CONFLICT (filename) DO NOTHING;

-- 10. SEED INITIAL HOSPITALS
INSERT INTO hospitals (id, name, type, address, latitude, longitude, patient_capacity) VALUES
    (1, 'City General Hospital', 'general', '101 Main Street, Mumbai, Maharashtra 400001', 19.0760, 72.8777, 500),
    (2, 'Northern District Hospital', 'general', '45 North Road, Delhi 110001', 28.7041, 77.1025, 350),
    (3, 'Rural Health Centre East', 'rural', 'Village Panchayat Road, Patna, Bihar 800001', 25.5941, 85.1376, 80),
    (4, 'Cardiac Specialty Institute', 'specialty', '200 Heart Avenue, Bangalore, Karnataka 560001', 12.9716, 77.5946, 200),
    (5, 'South Urban Medical Centre', 'urban', '78 Park Street, Chennai, Tamil Nadu 600001', 13.0827, 80.2707, 450)
ON CONFLICT (id) DO NOTHING;
SELECT setval('hospitals_id_seq', (SELECT COALESCE(MAX(id), 1) FROM hospitals));

-- 11. SEED INITIAL MEDICINES
INSERT INTO medicines (id, name, category, unit, critical, alternative_group) VALUES
    (1, 'Amoxicillin 500mg', 'antibiotic', 'tablet', false, 'penicillin_class'),
    (2, 'Azithromycin 250mg', 'antibiotic', 'tablet', false, 'macrolide_class'),
    (3, 'Paracetamol 500mg', 'analgesic', 'tablet', false, 'analgesic_basic'),
    (4, 'Ibuprofen 400mg', 'analgesic', 'tablet', false, 'analgesic_basic'),
    (5, 'Insulin Glargine', 'antidiabetic', 'vial', true, null),
    (6, 'Metformin 500mg', 'antidiabetic', 'tablet', false, 'biguanide_class'),
    (7, 'Adrenaline 1mg/ml', 'emergency', 'vial', true, null),
    (8, 'Morphine 10mg/ml', 'opioid', 'vial', true, null),
    (9, 'Atorvastatin 40mg', 'cardiac', 'tablet', false, 'statin_class'),
    (10, 'Aspirin 75mg', 'cardiac', 'tablet', false, 'antiplatelet'),
    (11, 'Salbutamol Inhaler', 'respiratory', 'inhaler', true, 'bronchodilator'),
    (12, 'Furosemide 40mg', 'diuretic', 'tablet', false, null),
    (13, 'ORS Sachet', 'rehydration', 'sachet', false, 'rehydration'),
    (14, 'IV Saline 0.9% 500ml', 'iv_fluid', 'bag', true, 'iv_crystalloid'),
    (15, 'Ceftriaxone 1g', 'antibiotic', 'vial', true, 'cephalosporin_3rd')
ON CONFLICT (id) DO NOTHING;
SELECT setval('medicines_id_seq', (SELECT COALESCE(MAX(id), 1) FROM medicines));

-- 12. SEED INITIAL INVENTORY
INSERT INTO inventory (hospital_id, medicine_id, quantity, safety_stock) VALUES
    (1, 1, 1200, 200),
    (1, 3, 800, 150),
    (1, 5, 25, 10),
    (1, 7, 50, 20),
    (1, 14, 200, 50),
    (2, 1, 600, 100),
    (2, 3, 500, 100),
    (2, 5, 10, 8),
    (2, 11, 30, 15),
    (2, 14, 80, 30),
    (3, 3, 200, 50),
    (3, 4, 150, 30),
    (3, 13, 500, 100),
    (3, 14, 20, 20),
    (4, 9, 2000, 300),
    (4, 10, 1500, 300),
    (4, 8, 40, 20),
    (4, 14, 300, 60),
    (5, 2, 900, 150),
    (5, 6, 400, 80),
    (5, 5, 60, 15),
    (5, 15, 100, 30)
ON CONFLICT (hospital_id, medicine_id) DO UPDATE SET
    quantity = EXCLUDED.quantity,
    safety_stock = EXCLUDED.safety_stock;

-- 13. SEED SAMPLE BATCHES
INSERT INTO batches (hospital_id, medicine_id, quantity, expiry_date) VALUES
    (1, 1, 500, CURRENT_DATE + INTERVAL '180 days'),
    (1, 1, 700, CURRENT_DATE + INTERVAL '365 days'),
    (1, 3, 400, CURRENT_DATE + INTERVAL '30 days'),
    (1, 3, 400, CURRENT_DATE + INTERVAL '200 days'),
    (1, 5, 15, CURRENT_DATE + INTERVAL '60 days'),
    (1, 5, 10, CURRENT_DATE + INTERVAL '14 days'),
    (1, 14, 100, CURRENT_DATE + INTERVAL '180 days'),
    (1, 14, 100, CURRENT_DATE + INTERVAL '7 days'),
    (2, 1, 300, CURRENT_DATE + INTERVAL '90 days'),
    (2, 1, 300, CURRENT_DATE + INTERVAL '21 days'),
    (2, 3, 250, CURRENT_DATE + INTERVAL '150 days'),
    (2, 5, 10, CURRENT_DATE + INTERVAL '45 days'),
    (3, 3, 100, CURRENT_DATE + INTERVAL '120 days'),
    (3, 13, 250, CURRENT_DATE + INTERVAL '240 days'),
    (3, 13, 250, CURRENT_DATE + INTERVAL '10 days'),
    (3, 14, 20, CURRENT_DATE + INTERVAL '90 days'),
    (4, 9, 1000, CURRENT_DATE + INTERVAL '365 days'),
    (4, 10, 750, CURRENT_DATE + INTERVAL '300 days'),
    (4, 8, 20, CURRENT_DATE + INTERVAL '180 days'),
    (4, 8, 20, CURRENT_DATE + INTERVAL '28 days'),
    (5, 2, 450, CURRENT_DATE + INTERVAL '200 days'),
    (5, 15, 50, CURRENT_DATE + INTERVAL '90 days'),
    (5, 15, 50, CURRENT_DATE + INTERVAL '15 days')
ON CONFLICT DO NOTHING;

-- 14. SEED SAMPLE DEMAND HISTORY
INSERT INTO demand_history (hospital_id, medicine_id, date, consumption, patient_load, emergency_demand)
SELECT
    1, 1,
    (CURRENT_DATE - (s || ' days')::INTERVAL)::DATE,
    ROUND((20 + (random() * 15))::numeric, 2),
    (150 + floor(random() * 50))::int,
    ROUND((random() * 5)::numeric, 2)
FROM generate_series(1, 30) AS s
ON CONFLICT (hospital_id, medicine_id, date) DO NOTHING;
