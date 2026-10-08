# Backend — Medical Supply Intelligence API

Node.js + Express REST API backend server connecting to PostgreSQL database for the MedSupply platform.

---

## Requirements

- **Node.js**: `v18.x` or higher (LTS recommended)
- **npm**: `v9.x` or higher
- **PostgreSQL**: `v14.x` or higher running locally on port `5432`

---

## Installation

```bash
cd Backend
npm install
```

---

## PostgreSQL Setup

1. Open your terminal or `psql` client:
   ```bash
   psql -U postgres
   ```
2. Create the target database:
   ```sql
   CREATE DATABASE singularity_db;
   ```

---

## Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configure the environment variables in `.env`:

```env
PORT=3000
NODE_ENV=development

# PostgreSQL Connection
DB_HOST=localhost
DB_PORT=5432
DB_NAME=singularity_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_POOL_MAX=10

# CORS Allowed Origin
CORS_ORIGIN=http://localhost:5173

# Authentication & JWT
JWT_SECRET=singularity_jwt_secret_key_change_in_prod
JWT_EXPIRES_IN=8h
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_admin_password

# External Integrations (Placeholders)
AI_SERVICE_URL=http://localhost:8000
N8N_TRIGGER_URL=http://localhost:5678/webhook/placeholder
```

> 🔒 **Security Notice:** Do not commit `.env` or real passwords/secrets to Git.

---

## Migration

Run schema migrations to initialize PostgreSQL tables:

```bash
npm run migrate
```

Migrations execute SQL files in `migrations/sql/` in sequence:
- `001_create_hospitals.sql` — Hospital facility registry
- `002_create_medicines.sql` — Master medicine SKUs & categories
- `003_create_inventory.sql` — Facility stock balances & safety stock limits
- `004_create_batches.sql` — Batch lots & expiration dates
- `005_create_demand_history.sql` — Daily consumption tracking
- `006_create_activity_log.sql` — Audit trails & recent activities
- `007_create_requests.sql` — Inter-hospital supply requests

---

## Seed

Populate the database with initial development and demo data:

```bash
npm run seed
```

- Seeders insert demo hospital profiles, medicine items, inventory balances, batch records, supply requests, and 30 days of demand history.
- All seeded data is for **development and demonstration purposes only**.

---

## Run Development Server

```bash
npm run dev
```

The server starts on `http://localhost:3000`.

---

## API Endpoints

### Health & Auth
- `GET /api/health` — Returns server health status and database connectivity.
- `POST /api/auth/login` — Authenticates user credentials and returns JWT bearer token.
- `GET /api/auth/me` — Returns authenticated user profile.

### Core Resources
- `GET /api/hospitals` — Returns list of network hospitals (supports `?type=`, `?page=`, `?limit=`).
- `GET /api/hospitals/:id` — Returns single hospital profile by ID.
- `GET /api/medicines` — Returns master catalog of medicines (supports `?category=`, `?critical=`, `?page=`, `?limit=`).
- `GET /api/medicines/:id` — Returns single medicine SKU details.
- `GET /api/inventory` — Returns inventory stock balances (supports `?hospital_id=`, `?medicine_id=`, `?page=`, `?limit=`).
- `GET /api/batches` — Returns batch lots with expiry dates (supports `?hospital_id=`, `?medicine_id=`, `?expiring_within_days=`, `?page=`, `?limit=`).

### Inventory Transactions & Requests
- `POST /api/entries` — Logs incoming stock shipments (`stock_received`) or ward consumption (`usage`).
- `GET /api/entries/recent` — Returns recent audit log activity entries for a hospital facility.
- `POST /api/requests` — Submits a medicine supply request to network hospitals (`urgency: Normal|Urgent|Critical`).
- `GET /api/requests` — Returns active medicine supply requests.
- `GET /api/demand-history` — Returns historical daily medicine demand records.

---

## Current Features

- Express 5 REST API architecture with modular controllers, routes, and centralized error handling.
- PostgreSQL connection pool (`pg`) with environment-configurable pooling limits.
- JWT authentication middleware and password security.
- Comprehensive transactional workflows for stock receipt, usage, and inter-facility supply requests.

---

## AI Integration Status

- **Status:** `AI PENDING` (Separate BackendAI Service)
- **Details:** Time-series demand forecasting (XGBoost), stockout risk probability scoring, PuLP linear programming optimization for inter-hospital redistribution, and automated n8n workflows will be integrated via `BackendAI` in future releases.
- **Current Behavior:** Demand history APIs return empirical consumption data; AI forecast overlays and risk modules are marked as pending.

---

## Troubleshooting

1. **Database connection failed (`ECONNREFUSED` / `password authentication failed`):**
   - Verify PostgreSQL is running on port `5432`.
   - Check `DB_USER`, `DB_PASSWORD`, and `DB_NAME` in `.env`.
   - Run `psql -U postgres -d singularity_db` to test local database access.
2. **Port 3000 in use:**
   - Change `PORT` in `.env` (e.g. `PORT=3001`) and update `VITE_API_BASE_URL` in `Frontend/.env`.
3. **Migration fails on existing tables:**
   - Migrations track applied scripts in table `schema_migrations`. If needed, re-create the database:
     ```sql
     DROP DATABASE singularity_db;
     CREATE DATABASE singularity_db;
     ```
   - Then re-run `npm run migrate && npm run seed`.
