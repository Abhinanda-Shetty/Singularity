# Frontend Status
# Medical Supply Intelligence

**Last updated:** 2026-10-08

---

## ✅ Working

- **App loads** at `http://localhost:5173`
- **Login page** renders correctly (credentials: admin / pass)
- **Dashboard** loads and connects to live backend data
- **Dashboard KPI cards** show real values from PostgreSQL:
  - Total medicine types: **60** (from `GET /api/medicines`)
  - Total stock (units): **9,665** (summed from `GET /api/inventory`)
  - At risk (low stock): **1** (items where qty ≤ safety_stock)
  - Expiring within 30 days: **21** (from `GET /api/batches?expiring_within_days=30`)
- **Header hospital name** shows real hospital: **"City General Hospital"** (from `GET /api/hospitals/1`)
- **Stock Donut Chart** renders with live inventory distribution data
- **Quick Insights** built from live KPI data (no more hardcoded values)
- **Inventory page → Entry form** loads real medicine list from backend (60 medicines via `GET /api/medicines`)
- **Hospital profile in Entry page** loaded from `GET /api/hospitals/1`
- **Navigation** — all sidebar routes work without crashes
- **Placeholder pages** (Forecast, Risks, Network, Transfers, Reports, Settings) render "coming soon" cleanly
- **Error handling** — API error banner shown on Dashboard if backend is unavailable
- **Loading states** — KPI cards show "—" during initial data fetch

---

## 🔧 Fixed

| Issue | Fix Applied |
|-------|-------------|
| `import React from 'react'` unused in 16 files | Removed — React 17+ JSX transform doesn't need it |
| `StockDonutChart` — `accumulatedPercent` reassignment after render (lint error) | Moved into `buildRenderedSegments()` function |
| `api.js` — `networkError` unused + no `cause` on rethrow | Fixed — `{ cause: networkError }` added |
| `app.options('*', cors())` crashing Express 5 | Changed to `app.options(/.*/, cors())` |
| Dashboard using 100% hardcoded mock data | Connected to real backend via `fetchDashboardSummary()` |
| Header using hardcoded `hospitalProfile` from mockData | Now fetches `GET /api/hospitals/1` |
| EntryPage medicines using in-memory mock array | Now fetches `GET /api/medicines?limit=100` |
| EntryPage hospital profile using mock constant | Now fetches `GET /api/hospitals/1` |
| No centralized API client | Created `src/services/api.js` |
| No frontend environment config | Created `Frontend/.env` and `Frontend/.env.example` |
| CORS origin was `*` (less secure) | Set to `http://localhost:5173` with preflight support |

---

## 🔌 Backend Endpoints Connected

| Endpoint | Used By | Data |
|----------|---------|------|
| `GET /api/health` | `services/api.js` health check | Server + DB status |
| `GET /api/hospitals/1` | `Header.jsx`, `EntryPage/api.js` | Hospital name, address |
| `GET /api/medicines?limit=100` | `EntryPage/api.js` | Medicine dropdown |
| `GET /api/medicines?limit=1` | `DashboardPage.jsx` | Medicine count KPI |
| `GET /api/inventory?limit=100` | `DashboardPage.jsx` | Stock KPI + donut chart |
| `GET /api/batches?expiring_within_days=30&limit=1` | `DashboardPage.jsx` | Expiring soon KPI |

---

## ❌ Remaining Backend Dependencies (Not Yet Implemented)

| Feature | What's Missing | Notes |
|---------|----------------|-------|
| Demand chart | `GET /api/demand-history` or forecast API | Requires BackendAI integration (Phase 4) |
| Forecast page | AI forecast endpoints | Pending BackendAI contract |
| Risks & Alerts page | Risk scoring API | Pending BackendAI contract |
| Network page | Could use `GET /api/hospitals` | Currently placeholder — easy to add |
| Transfers page | `GET/POST /api/transfers` | Backend endpoint not implemented |
| Reports page | No reports API | Backend endpoint not implemented |
| Settings page | No settings API | Backend endpoint not implemented |
| Entry → Save stock received | `POST /api/batches` | Backend write API not implemented |
| Entry → Save daily usage | `PATCH /api/inventory` | Backend write API not implemented |
| Entry → Send request | `POST /api/transfers` or requests API | Backend write API not implemented |
| Recent entries activity log | `GET /api/entries/recent` | Backend endpoint not implemented |

---

## Known Limitations

1. **Entry page write operations are mocked** — Stock received, daily usage, and request submissions update local state only. They do not persist to the database. Backend POST/PATCH write APIs do not yet exist.
2. **Hospital is hardcoded to ID=1** — The system treats `hospital_id=1` as the logged-in hospital. A real auth system would determine this from a JWT token.
3. **Demand chart still uses mockData** — The DemandChart component still renders hardcoded chart data. Backend demand history / forecast APIs are pending.
4. **Multiple seed runs** — The database has duplicate hospital rows (IDs 1–20) due to multiple seed runs. All hospital API calls use ID=1 which points to the first hospital.
5. **Inventory data is not filtered by hospital** — The dashboard loads all 22 inventory rows across all hospitals. For a real multi-tenant portal, inventory should be filtered by `hospital_id`.

---

## Test Results

| Test | Result |
|------|--------|
| `npm install` | ✅ 0 vulnerabilities |
| `npm run lint` | ✅ 0 errors, 0 warnings |
| `npm run build` | ✅ Built in 1.46s |
| Backend `node server.js` | ✅ Connected to PostgreSQL |
| `GET /api/health` | ✅ `{ status: "ok" }` |
| `GET /api/hospitals/1` | ✅ Returns "City General Hospital" |
| `GET /api/medicines?limit=1` | ✅ `meta.total = 60` |
| `GET /api/inventory?limit=100` | ✅ 22 rows, sum = 9,665 units |
| `GET /api/batches?expiring_within_days=30` | ✅ `meta.total = 21` |
| `GET /api/medicines?limit=100` | ✅ 60 medicines returned for Entry dropdown |
| Dashboard KPI cards render | ✅ Real live values |
| Header hospital name | ✅ "City General Hospital" |
| Entry medicines dropdown | ✅ 60 real medicines from backend |
| All placeholder pages load | ✅ No crashes |
| Production build | ✅ Succeeds |

---

## Files Changed

### Frontend (new/modified)
| File | Change |
|------|--------|
| `src/services/api.js` | **NEW** — centralized API client |
| `src/pages/Dashboard/DashboardPage.jsx` | Connected to live backend KPI data |
| `src/components/Header.jsx` | Connected to `GET /api/hospitals/1` |
| `src/components/StockDonutChart.jsx` | Accepts live inventory props, lint fix |
| `src/pages/EntryPage/api.js` | Real `getMedicines` + `getHospitalProfile` from backend |
| `.env` | **NEW** — `VITE_API_BASE_URL=http://localhost:3000/api` |
| `.env.example` | **NEW** — template for environment config |
| All 16 React files | Removed unused `import React` (lint fix) |

### Backend (modified)
| File | Change |
|------|--------|
| `src/app.js` | CORS updated to `http://localhost:5173`, preflight fixed for Express 5 |
| `.env` | `CORS_ORIGIN` updated to `http://localhost:5173` |

### Root
| File | Change |
|------|--------|
| `FRONTEND_BACKEND_INTEGRATION.md` | **NEW** — complete integration map |

---

## BackendAI Confirmation
✅ `./BackendAI` was **NOT modified**. Zero files touched in that directory.
