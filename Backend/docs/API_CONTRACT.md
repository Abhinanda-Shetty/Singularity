# API Contract
# Medical Supply Intelligence — Backend REST API

**Base URL:** `http://localhost:3000`
**Content-Type:** `application/json`

All responses follow a standard envelope:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "optional",
  "meta": { "total": 100, "page": 1, "limit": 20 }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE"
}
```

---

## Phase 1 — Implemented Endpoints

---

### GET /api/health

Returns server and database status.

**Method:** `GET`
**Endpoint:** `/api/health`
**Request:** None

**Response 200 (DB connected):**
```json
{
  "success": true,
  "status": "ok",
  "timestamp": "2026-10-08T10:00:00.000Z",
  "environment": "development",
  "version": "1.0.0",
  "database": {
    "connected": true,
    "timestamp": "2026-10-08T10:00:00.123Z"
  }
}
```

**Response 503 (DB not connected):**
```json
{
  "success": true,
  "status": "ok",
  "timestamp": "2026-10-08T10:00:00.000Z",
  "environment": "development",
  "version": "1.0.0",
  "database": {
    "connected": false,
    "error": "connection refused"
  }
}
```

**HTTP Status Codes:**
| Code | Reason |
|------|--------|
| 200  | Server running, DB connected |
| 503  | Server running, DB not connected |

---

## Phase 2 — Planned Endpoints

These endpoints will be implemented in Phase 3.

---

### GET /api/hospitals

**Method:** `GET`
**Endpoint:** `/api/hospitals`
**Query Params:** `?page=1&limit=20&type=general`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "City General Hospital",
      "type": "general",
      "address": "101 Main Street, Mumbai",
      "latitude": 19.0760,
      "longitude": 72.8777,
      "patient_capacity": 500,
      "created_at": "2026-10-01T00:00:00Z",
      "updated_at": "2026-10-01T00:00:00Z"
    }
  ],
  "meta": { "total": 5, "page": 1, "limit": 20 }
}
```

**HTTP Status Codes:**
| Code | Reason |
|------|--------|
| 200  | Success |
| 500  | Internal server error |

---

### GET /api/hospitals/:id

**Method:** `GET`
**Endpoint:** `/api/hospitals/:id`

**Response 200:** Single hospital object (same structure as above)

**Response 404:**
```json
{ "success": false, "error": "Hospital not found", "code": "NOT_FOUND" }
```

---

### GET /api/medicines

**Method:** `GET`
**Endpoint:** `/api/medicines`
**Query Params:** `?page=1&limit=20&category=antibiotic&critical=true`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Amoxicillin 500mg",
      "category": "antibiotic",
      "unit": "tablet",
      "critical": false,
      "alternative_group": "penicillin_class",
      "created_at": "2026-10-01T00:00:00Z",
      "updated_at": "2026-10-01T00:00:00Z"
    }
  ],
  "meta": { "total": 15, "page": 1, "limit": 20 }
}
```

---

### GET /api/inventory

**Method:** `GET`
**Endpoint:** `/api/inventory`
**Query Params:** `?hospital_id=1&medicine_id=2&page=1&limit=20`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "hospital_id": 1,
      "medicine_id": 1,
      "quantity": 1200,
      "safety_stock": 200,
      "updated_at": "2026-10-08T00:00:00Z"
    }
  ],
  "meta": { "total": 22, "page": 1, "limit": 20 }
}
```

---

### GET /api/batches

**Method:** `GET`
**Endpoint:** `/api/batches`
**Query Params:** `?hospital_id=1&medicine_id=2&expiring_within_days=30&page=1&limit=20`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "hospital_id": 1,
      "medicine_id": 3,
      "quantity": 400,
      "expiry_date": "2026-11-07",
      "created_at": "2026-10-01T00:00:00Z",
      "updated_at": "2026-10-01T00:00:00Z"
    }
  ],
  "meta": { "total": 5, "page": 1, "limit": 20 }
}
```

---

## Error Format (All Endpoints)

```json
{
  "success": false,
  "error": "Descriptive error message",
  "code": "ERROR_CODE"
}
```

Common error codes:
| Code              | Meaning                        |
|-------------------|--------------------------------|
| ROUTE_NOT_FOUND   | Endpoint does not exist        |
| NOT_FOUND         | Resource not found             |
| VALIDATION_ERROR  | Invalid input parameters       |
| INTERNAL_ERROR    | Unexpected server error        |

---

## Future Integration Contracts

These sections define integration ownership. Implementation is NOT part of Phase 1.

---

### AI Service (BackendAI)

**Owner:** AI Team
**Status:** Contract not yet defined

Planned endpoints (backend will call these, not expose them directly):

```
POST /api/predict/forecast
POST /api/predict/risk
POST /api/optimize/redistribution
```

Backend will:
- Call these endpoints when forecast/risk/redistribution data is requested
- Validate and store results in PostgreSQL
- Expose stored results via `/api/forecasts`, `/api/priorities`, `/api/transfers`

---

### Redistribution / PuLP Service

**Owner:** AI Team
**Status:** Contract not yet defined

PuLP optimization results will be received via BackendAI.
Backend will persist redistribution recommendations as Transfer records.

---

### n8n Negotiation Workflow

**Owner:** Automation / n8n Team
**Status:** Contract not yet defined

Backend responsibilities:
- Trigger n8n workflow with supply order context (method TBD)
- Receive negotiation result via `POST /api/negotiations/webhook`
- Persist result to `negotiations` table

Webhook payload schema: Not yet defined
