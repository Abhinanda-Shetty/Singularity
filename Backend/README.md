# Backend — Medical Supply Intelligence / Logistics

Node.js + Express REST API backend for the Singularity Medical Supply Intelligence system.

---

## Tech Stack

| Technology     | Version | Purpose                          |
|----------------|---------|----------------------------------|
| Node.js        | LTS     | Runtime                          |
| Express.js     | 5.x     | HTTP framework                   |
| PostgreSQL      | 14+     | Relational database               |
| pg             | 8.x     | PostgreSQL client (node-postgres) |
| dotenv         | 18.x    | Environment variable loading     |
| cors           | 2.x     | CORS middleware                  |
| nodemon        | 3.x     | Development auto-restart         |

---

## Prerequisites

- Node.js 18+ (LTS recommended)
- PostgreSQL 14+ running locally or via Docker
- npm 9+

---

## Project Structure

```
Backend/
├── src/
│   ├── config/
│   │   └── database.js         # PostgreSQL pool configuration
│   ├── controllers/
│   │   └── healthController.js # GET /api/health handler
│   ├── middleware/
│   │   ├── errorHandler.js     # 404 + centralized error middleware
│   │   └── requestLogger.js    # Request/response logger
│   ├── models/                 # (Phase 3) Query models per entity
│   ├── routes/
│   │   └── health.js           # Health check route
│   ├── services/
│   │   ├── aiService.js        # AI service client (placeholder)
│   │   └── n8nService.js       # n8n service client (placeholder)
│   ├── utils/
│   │   ├── AppError.js         # Operational error class
│   │   └── responseHelpers.js  # Standard response envelope helpers
│   └── app.js                  # Express app setup
│
├── migrations/
│   ├── runner.js               # Migration runner script
│   └── sql/
│       ├── 001_create_hospitals.sql
│       ├── 002_create_medicines.sql
│       ├── 003_create_inventory.sql
│       ├── 004_create_batches.sql
│       └── 005_create_demand_history.sql
│
├── seed/
│   ├── runner.js               # Seed runner script
│   └── seeders/
│       ├── hospitals.js
│       ├── medicines.js
│       ├── inventory.js
│       ├── batches.js
│       └── demandHistory.js
│
├── docs/
│   └── API_CONTRACT.md         # Full API documentation
│
├── .env.example                # Environment variable template
├── server.js                   # Entry point with graceful shutdown
├── package.json
├── IMPLEMENTATION_PLAN.md      # Architecture and phase plan
└── README.md
```

---

## Quick Start

### 1. Clone / navigate to the Backend directory

```bash
cd Backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your PostgreSQL credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=singularity_db
DB_USER=postgres
DB_PASSWORD=your_password
PORT=3000
NODE_ENV=development
```

### 4. Create the database

```sql
-- In psql or pgAdmin:
CREATE DATABASE singularity_db;
```

### 5. Run migrations

```bash
npm run migrate
```

This will create all tables and indexes. Migrations are tracked in `schema_migrations` and are idempotent (safe to re-run).

### 6. Seed development data (optional)

```bash
npm run seed
```

This populates hospitals, medicines, inventory, batches, and 30 days of demand history.

### 7. Start the development server

```bash
npm run dev
```

Server starts on `http://localhost:3000`.

---

## Available Scripts

| Script             | Command               | Description                          |
|--------------------|-----------------------|--------------------------------------|
| `npm run dev`      | `nodemon server.js`   | Development server with auto-restart |
| `npm start`        | `node server.js`      | Production server                    |
| `npm run migrate`  | `node migrations/runner.js` | Run pending database migrations |
| `npm run seed`     | `node seed/runner.js` | Seed development data                |

---

## API Endpoints

### Phase 1 (Implemented)

| Method | Endpoint      | Description               |
|--------|---------------|---------------------------|
| GET    | /api/health   | Server + DB health check  |

### Phase 3 (Planned)

| Method | Endpoint           | Description                    |
|--------|--------------------|--------------------------------|
| GET    | /api/hospitals     | List hospitals                 |
| GET    | /api/hospitals/:id | Get single hospital            |
| GET    | /api/medicines     | List medicines                 |
| GET    | /api/medicines/:id | Get single medicine            |
| GET    | /api/inventory     | List inventory (filterable)    |
| GET    | /api/batches       | List batches (filterable)      |

See `docs/API_CONTRACT.md` for full request/response documentation.

---

## Database Schema

### Core Tables (Phase 1)

| Table           | Purpose                                    |
|-----------------|--------------------------------------------|
| hospitals       | Master registry of all hospitals           |
| medicines       | Master catalog of all medicines            |
| inventory       | Current stock level per hospital/medicine  |
| batches         | Physical batches with expiry tracking      |
| demand_history  | Daily consumption history for AI forecasting|
| schema_migrations | Tracks applied migrations               |

### Phase B Tables (Phase 4+)

| Table           | Purpose                                    |
|-----------------|--------------------------------------------|
| forecasts       | AI-generated demand predictions            |
| priorities      | AI-assigned redistribution priorities      |
| transfers       | Inter-hospital medicine transfers          |
| suppliers       | Supplier master data                       |
| supply_orders   | Procurement orders                         |
| negotiations    | n8n negotiation outcomes                   |

---

## Integration Contracts

### AI Service (BackendAI)
- Base URL: set `AI_SERVICE_URL` in `.env`
- Contract schema: **Not yet defined** — see `docs/API_CONTRACT.md`

### n8n Automation
- Trigger URL: set `N8N_TRIGGER_URL` in `.env`
- Webhook endpoint: `POST /api/negotiations/webhook` (Phase 6)
- Contract schema: **Not yet defined** — see `docs/API_CONTRACT.md`

### Frontend
- Frontend communicates exclusively with this Backend
- No direct database access from Frontend
- All responses follow standard JSON envelope (see `docs/API_CONTRACT.md`)

---

## Development Notes

- Never commit `.env` — only commit `.env.example`
- Run `npm run migrate` before `npm run seed`
- Seeds are idempotent — safe to re-run
- Error middleware is centralized in `src/middleware/errorHandler.js`
- Use `AppError` class for operational errors (validation, not-found, etc.)
- Use `asyncHandler` wrapper for all async route handlers
