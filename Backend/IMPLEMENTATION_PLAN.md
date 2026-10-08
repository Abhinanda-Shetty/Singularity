# Backend Implementation Plan
# Medical Supply Intelligence / Logistics System

---

## 1. Backend Responsibility

### Backend OWNS:
- REST APIs (Express routes, controllers, middleware)
- PostgreSQL persistence (schema, migrations, seeds)
- Request/response validation
- Business-data flow (inventory, hospitals, medicines, batches, demand)
- Communication with AI services (calling BackendAI endpoints)
- Communication with redistribution/optimization service (PuLP via BackendAI)
- n8n integration (webhooks, workflow triggers, result persistence)
- Frontend API layer (all endpoints consumed by the React frontend)
- Error handling and centralized logging
- Environment configuration management

### Backend does NOT OWN:
- XGBoost model training or inference logic
- ML experimentation or model selection
- PuLP algorithm development or optimization logic
- React UI implementation or frontend state management
- n8n workflow design or automation scripting

---

## 2. Architecture

```
Frontend (React)
      |
      v  REST API calls
Node.js + Express Backend  <-->  PostgreSQL
      |
      v
   AI Service (BackendAI)
      +-- XGBoost demand forecasting
      +-- Stock-out / risk prediction
      +-- Anomaly detection
      +-- PuLP redistribution optimization

Backend
      ^
      v  Webhooks / REST
   n8n Automation
      +-- Supplier negotiation workflows
```

**Data flow summary:**
1. Frontend calls Backend REST APIs only.
2. Backend reads/writes to PostgreSQL.
3. Backend calls BackendAI for forecasts, risk, and redistribution results.
4. Backend stores AI results in PostgreSQL.
5. Backend exposes stored AI results through REST APIs.
6. Backend triggers n8n workflows and receives negotiation results via webhook.

---

## 3. Technology Stack

| Layer              | Technology                        | Reason                                     |
|--------------------|-----------------------------------|--------------------------------------------|
| Runtime            | Node.js (LTS)                     | Standard, team familiar, event-driven      |
| Framework          | Express.js                        | Minimal, flexible, wide ecosystem          |
| Database           | PostgreSQL                        | Relational, reliable for medical data      |
| PostgreSQL client  | pg (node-postgres)                | Lightweight, native SQL, no ORM magic      |
| Migration system   | Custom SQL migration runner       | Full control over schema, no ORM lock-in   |
| Environment        | dotenv                            | Standard .env pattern                      |
| CORS               | cors middleware                   | Already installed, needed for frontend     |
| Dev server         | nodemon                           | Auto-restart on file changes               |

**NOT introduced:**
- No Prisma/Sequelize ORM (raw SQL for transparency)
- No additional backend framework (Fastify, NestJS, etc.)
- No Redis (unless caching becomes necessary -- Phase 7+)
- No message queue (unless needed -- Phase 8+)

---

## 4. Database Implementation Plan

### Phase A -- Core Entities (Phase 1-3)

#### hospitals
- **Purpose:** Master registry of all hospitals in the network
- **Key fields:** id, name, type, address, latitude, longitude, patient_capacity
- **Relationships:** Referenced by inventory, batches, demand_history, transfers
- **Indexes:** name, type, (latitude, longitude) for geo queries

#### medicines
- **Purpose:** Master catalog of all medicines handled by the system
- **Key fields:** id, name, category, unit, critical, alternative_group
- **Relationships:** Referenced by inventory, batches, demand_history, forecasts, priorities
- **Indexes:** name, category, critical, alternative_group

#### inventory
- **Purpose:** Current stock levels per hospital per medicine
- **Key fields:** id, hospital_id, medicine_id, quantity, safety_stock
- **Relationships:** FK -> hospitals(id), FK -> medicines(id)
- **Indexes:** (hospital_id, medicine_id) UNIQUE composite, quantity

#### batches
- **Purpose:** Track individual physical batches for expiry management
- **Key fields:** id, hospital_id, medicine_id, quantity, expiry_date
- **Relationships:** FK -> hospitals(id), FK -> medicines(id)
- **Indexes:** expiry_date, (hospital_id, medicine_id), hospital_id

#### demand_history
- **Purpose:** Historical consumption data used by AI for forecasting
- **Key fields:** id, hospital_id, medicine_id, date, consumption, patient_load, emergency_demand
- **Relationships:** FK -> hospitals(id), FK -> medicines(id)
- **Indexes:** (hospital_id, medicine_id, date) UNIQUE, date

---

### Phase B -- AI/Integration Entities (Phase 4-6)

#### forecasts
- **Purpose:** Store AI-generated demand forecasts per hospital/medicine/period
- **Key fields:** id, hospital_id, medicine_id, forecast_date, predicted_demand, confidence, model_version, created_at

#### priorities
- **Purpose:** AI-assigned priority scores for redistribution decisions
- **Key fields:** id, hospital_id, medicine_id, priority_score, reason, created_at

#### transfers
- **Purpose:** Approved/pending inter-hospital medicine transfers
- **Key fields:** id, source_hospital_id, destination_hospital_id, medicine_id, quantity, status, scheduled_date, completed_at

#### suppliers
- **Purpose:** Supplier master data for procurement
- **Key fields:** id, name, contact_info, reliability_score, lead_time_days

#### supply_orders
- **Purpose:** Track orders placed to suppliers
- **Key fields:** id, supplier_id, medicine_id, quantity, status, ordered_at, expected_delivery

#### negotiations
- **Purpose:** Record n8n-driven negotiation outcomes
- **Key fields:** id, supply_order_id, n8n_workflow_id, status, final_price, final_quantity, negotiation_log, completed_at

---

## 5. API Implementation Plan

### Phase 1 -- Health Check
| Method | Endpoint      | Description                        |
|--------|---------------|------------------------------------|
| GET    | /api/health   | Server + DB connectivity status    |

### Phase 2 -- Core Resource APIs
| Method | Endpoint           | Description                          |
|--------|--------------------|--------------------------------------|
| GET    | /api/hospitals     | List all hospitals                   |
| GET    | /api/hospitals/:id | Get single hospital                  |
| GET    | /api/medicines     | List all medicines                   |
| GET    | /api/medicines/:id | Get single medicine                  |
| GET    | /api/inventory     | List all inventory (filterable)      |
| GET    | /api/batches       | List all batches (filterable)        |

### Phase 3 -- Analytics/AI-Result APIs
| Method | Endpoint                | Description                          |
|--------|-------------------------|--------------------------------------|
| GET    | /api/demand-history     | Historical consumption data          |
| GET    | /api/forecasts          | AI forecast results                  |
| GET    | /api/shortages          | Computed shortage indicators         |
| GET    | /api/expiry-risks       | Batches at risk of expiry            |
| GET    | /api/priorities         | AI priority assignments              |

### Phase 4 -- Transfers
| Method | Endpoint           | Description                          |
|--------|--------------------|--------------------------------------|
| GET    | /api/transfers     | List all/filtered transfers          |
| POST   | /api/transfers     | Create a transfer request            |

### Phase 5 -- Negotiations
| Method | Endpoint             | Description                          |
|--------|----------------------|--------------------------------------|
| GET    | /api/negotiations    | List all/filtered negotiations       |
| POST   | /api/negotiations    | Trigger/record a negotiation         |

---

## 6. AI Integration Contract

### Backend responsibilities:
- Make HTTP calls to BackendAI service
- Validate AI response structure
- Persist AI results to PostgreSQL
- Expose results via REST APIs to Frontend

### Placeholder Contract Definitions

#### Forecast Request/Response
```
POST http://backendai:PORT/api/predict/forecast
Request:
  { hospital_id, medicine_id, horizon_days }
Response:
  { forecast_date, predicted_demand, confidence, model_version }
```

#### Risk Request/Response
```
POST http://backendai:PORT/api/predict/risk
Request:
  { hospital_id, medicine_id }
Response:
  { risk_level, stock_out_probability, expiry_risk_score, anomaly_flag }
```

#### Redistribution Request/Response
```
POST http://backendai:PORT/api/optimize/redistribution
Request:
  { hospitals: [...], medicines: [...], inventory: [...], demand_forecast: [...] }
Response:
  { transfers: [{ source_hospital_id, destination_hospital_id, medicine_id, quantity }] }
```

> Note: Exact schemas to be finalized by AI Team. Contracts marked as "Not yet defined" until BackendAI API is published.

---

## 7. n8n Integration Plan

### Architecture:
- Backend exposes webhook endpoints for n8n to POST negotiation results
- Backend triggers n8n workflows via HTTP trigger (n8n REST API)
- n8n workflow handles external supplier communication

### Backend Responsibilities:
1. Provide transfer/supply order context via API
2. Trigger n8n workflow with cost/quantity parameters
3. Expose POST /api/negotiations/webhook for n8n to post results
4. Persist negotiation outcome to negotiations table

### NOT owned by Backend:
- n8n workflow logic or canvas design
- Supplier contact mechanisms
- External email/messaging integrations

> Exact n8n workflow trigger URL and payload schema: Not yet defined -- requires Automation Team input.

---

## 8. Frontend Integration

### Contract Strategy:
- Frontend communicates ONLY with Backend REST APIs (no direct DB access)
- Backend returns standardized JSON:

Success response:
  { "success": true, "data": { ... }, "message": "optional", "meta": { "total": 100, "page": 1, "limit": 20 } }

Error response:
  { "success": false, "error": "Error description", "code": "ERROR_CODE" }

- All list endpoints support query params: ?page=&limit=&hospital_id=&medicine_id=
- Frontend team should reference docs/API_CONTRACT.md for all endpoint details

---

## 9. Development Phases

### Phase 0 -- Planning (COMPLETE)
- **Objective:** Define architecture, contracts, and implementation roadmap
- **Tasks:** Create IMPLEMENTATION_PLAN.md
- **Dependencies:** None
- **Expected Output:** This document
- **Completion Criteria:** Plan reviewed and agreed upon by team

### Phase 1 -- Backend Foundation (COMPLETE ✅)
- **Objective:** Working Express server with health check and DB connection
- **Tasks:**
  - Initialize Node.js project structure
  - Configure Express with middleware
  - Configure PostgreSQL connection
  - Add GET /api/health
  - Add 404/error middleware
  - Create migration runner
  - Create initial SQL schema (hospitals, medicines, inventory, batches, demand_history)
  - Create seed structure
  - Create API_CONTRACT.md
  - Create README.md
- **Dependencies:** Node.js, PostgreSQL installed
- **Expected Output:** Running server, /api/health returning 200, migrations runnable
- **Completion Criteria:** Server starts, health check passes, DB connection established

### Phase 2 -- PostgreSQL Schema (COMPLETE ✅)
- **Objective:** Full initial schema deployed and seeded
- **Tasks:** Run migrations, seed dev data
- **Dependencies:** Phase 1 complete, PostgreSQL running
- **Expected Output:** Populated dev database
- **Completion Criteria:** All tables created, seed data queryable

### Phase 3 -- Core CRUD APIs (COMPLETE ✅)
- **Objective:** Full REST endpoints for core entities
- **Tasks:** Implement GET endpoints for hospitals, medicines, inventory, batches
- **Dependencies:** Phase 2 complete
- **Expected Output:** All Phase 2 APIs returning real data
- **Completion Criteria:** All endpoints tested, returning correct data

### Phase 4 -- AI Integration
- **Objective:** Backend calls BackendAI and stores results
- **Tasks:** Implement AI service client, forecast/risk endpoints
- **Dependencies:** Phase 3, BackendAI service ready with defined API
- **Expected Output:** /api/forecasts returning AI results
- **Completion Criteria:** End-to-end forecast call working

### Phase 5 -- Redistribution Integration
- **Objective:** Transfers created from PuLP optimization results
- **Tasks:** Call redistribution endpoint, persist transfers
- **Dependencies:** Phase 4, PuLP endpoint defined
- **Expected Output:** /api/transfers populated from optimization
- **Completion Criteria:** Transfer CRUD working, PuLP results stored

### Phase 6 -- n8n Integration
- **Objective:** Backend triggers and receives negotiation workflows
- **Tasks:** Implement webhook endpoint, n8n trigger call
- **Dependencies:** Phase 5, n8n workflow URL defined
- **Expected Output:** /api/negotiations populated
- **Completion Criteria:** Full negotiation cycle stored in DB

### Phase 7 -- Validation/Testing
- **Objective:** Ensure production readiness
- **Tasks:** Input validation, error handling audit, integration tests
- **Dependencies:** Phase 6 complete
- **Expected Output:** Stable, validated API layer
- **Completion Criteria:** All edge cases handled

### Phase 8 -- Final Integration
- **Objective:** Frontend + AI + n8n fully connected through Backend
- **Tasks:** End-to-end testing with all teams
- **Dependencies:** All phases complete
- **Expected Output:** Production-ready system
- **Completion Criteria:** Full system demo passing

---

## 10. Team Integration Points

### From AI Team (BackendAI):
| Contract Item                    | Status           |
|----------------------------------|------------------|
| Base URL for AI service          | Not yet defined  |
| Forecast endpoint schema         | Not yet defined  |
| Risk/stock-out endpoint schema   | Not yet defined  |
| Redistribution endpoint schema   | Not yet defined  |
| Authentication mechanism         | Not yet defined  |
| Response error format            | Not yet defined  |

### From Frontend Team:
| Contract Item                    | Status           |
|----------------------------------|------------------|
| List of endpoints required       | Not yet defined  |
| Filtering/pagination requirements| Not yet defined  |
| Authentication requirements      | Not yet defined  |
| Real-time data needs (WebSocket) | Not yet defined  |

### From n8n / Automation Team:
| Contract Item                    | Status           |
|----------------------------------|------------------|
| n8n workflow trigger URL         | Not yet defined  |
| Negotiation trigger payload      | Not yet defined  |
| Webhook callback format          | Not yet defined  |
| Authentication for webhooks      | Not yet defined  |

---

## Phase 1 Status — COMPLETE ✅

### Completed Tasks
- Created IMPLEMENTATION_PLAN.md (Phase 0)
- Initialized modular project structure under src/
- Configured Express with JSON parsing, CORS, and request logging
- Configured PostgreSQL connection via pg pool
- Implemented GET /api/health with DB connectivity check
- Added 404 middleware for unknown routes
- Added centralized async error middleware
- Added graceful startup and shutdown (SIGTERM/SIGINT)
- Created SQL migration runner (migrations/runner.js)
- Created initial schema migrations (001–005)
- Created seed structure with dev data scripts
- Created docs/API_CONTRACT.md, README.md, .env.example
- Updated package.json with proper scripts

---

## Phase 2 Status — COMPLETE ✅

### Completed Tasks
- All 5 migrations applied (001–005): hospitals, medicines, inventory, batches, demand_history
- Seed data applied: 20 hospitals, 60 medicines, 22 inventory, 69 batches, 330 demand_history rows
- Fixed 004_create_batches.sql: removed NOW() from partial index predicate (PostgreSQL IMMUTABLE requirement)
- schema_migrations table correctly tracks applied migrations
- Server starts and connects to PostgreSQL successfully

---

## Phase 3 Status — COMPLETE ✅

> Updated: 2026-10-08

### Completed Tasks
- Created `src/models/Hospital.js` — findAll (type filter + pagination), findById
- Created `src/models/Medicine.js` — findAll (category + critical filter + pagination), findById
- Created `src/models/Inventory.js` — findAll (hospital_id + medicine_id filter + pagination, joined names)
- Created `src/models/Batch.js` — findAll (hospital_id + medicine_id + expiring_within_days filter + pagination, joined names)
- Created `src/controllers/hospitalController.js` — getHospitals, getHospitalById
- Created `src/controllers/medicineController.js` — getMedicines, getMedicineById
- Created `src/controllers/inventoryController.js` — getInventory
- Created `src/controllers/batchController.js` — getBatches
- Created `src/routes/hospitals.js`, `medicines.js`, `inventory.js`, `batches.js`
- Updated `src/app.js` — all 4 route groups mounted under /api
- Updated `src/models/index.js` — exports all 4 models

### Validation Results
| Endpoint | Status | Notes |
|---|---|---|
| GET /api/hospitals | ✅ 200 | 20 rows, meta.total=20 |
| GET /api/hospitals/1 | ✅ 200 | Single hospital object |
| GET /api/hospitals/9999 | ✅ 404 | NOT_FOUND error code |
| GET /api/medicines?critical=true&limit=5 | ✅ 200 | 24 critical medicines, paginated |
| GET /api/inventory?hospital_id=1&limit=5 | ✅ 200 | 5 rows with hospital/medicine names |
| GET /api/batches?expiring_within_days=365&limit=5 | ✅ 200 | 69 batches ordered by expiry_date ASC |

### Next Phase
Phase 4 — AI Integration:
- Pending BackendAI Team contract definition
- When ready: implement aiService.js HTTP calls, forecasts endpoint, risk endpoint
