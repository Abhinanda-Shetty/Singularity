# Medical Supply Intelligence (MedSupply)

## 1. Project Purpose
**Medical Supply Intelligence** is an automated hospital supply coordination and predictive balancing platform. It enables hospital staff to record stock received, log daily clinical ward dispensing, and request critical medications across a regional hospital grid. The platform connects clinical inventory telemetry with predictive demand forecasting and automated inter-hospital redistribution to prevent localized stockouts and minimize medicine expiration waste.

---

## 2. Frontend Setup & Run Commands

From the project root:

```bash
# Navigate to the frontend workspace
cd Frontend

# Install dependencies (React 19, react-router-dom, lucide-react, Vite)
npm install

# Start the Vite development server (typically runs on http://localhost:5173 or :5174)
npm run dev

# Run production build validation
npm run build

# Run linting check
npm run lint
```

---

## 3. Project Structure

```
Singularity/
├── Backend/                 # Node.js + Express API Gateway & Data Store
│   ├── app.js               # Main Express application entrypoint
│   ├── script.js            # Utility scripts / database migrations
│   └── package.json         # Backend dependencies (express, cors, dotenv, nodemon)
├── BackendAI/               # Python AI/ML predictive analytics & optimization service
│   └── venv/                # Python virtual environment
├── Frontend/                # React 19 + Vite web application
│   ├── src/
│   │   ├── components/      # UI components (Header, Sidebar, KPI Cards, Charts, Entry components)
│   │   │   ├── entry/       # Inventory Entry forms, TopBar, TabBar, CSS, and standalone SVGs
│   │   │   └── ...          # Dashboard charts (DemandChart, StockDonutChart, KpiCard)
│   │   ├── pages/           # Application views
│   │   │   ├── Landing/     # Public landing overview
│   │   │   ├── Login/       # Hospital authentication
│   │   │   ├── Dashboard/   # Executive telemetry dashboard
│   │   │   ├── Inventory/   # Inventory management hub (integrates EntryPage form)
│   │   │   ├── EntryPage/   # Medical supply data entry & request workflow
│   │   │   ├── Forecast/    # Demand projection view
│   │   │   ├── Risks/       # Stockout & expiry risks
│   │   │   ├── Network/     # Inter-hospital grid view
│   │   │   ├── Transfers/   # Logistics & redistribution recommendations
│   │   │   ├── Reports/     # Clinical audit reports
│   │   │   └── Settings/    # Facility configurations
│   │   ├── layouts/         # DashboardLayout (Sidebar + Header + Outlet)
│   │   ├── data/            # Frontend mock data
│   │   ├── App.jsx          # Route definitions
│   │   └── main.jsx         # Client entrypoint with BrowserRouter
│   └── package.json
└── README.md                # Root architecture and integration documentation
```

---

## 4. Frontend / Backend Architecture

```
┌─────────────────────────────────┐
│     React 19 Frontend (SPA)     │
│  - Executive Dashboard & Charts │
│  - Medical Supply Entry (Form)  │
│  - Stock & Transfer Requests    │
└────────────────┬────────────────┘
                 │ HTTP / REST (JSON)
                 ▼
┌─────────────────────────────────┐
│  Node.js + Express API Gateway  │
│  - Authentication & RBAC        │
│  - Inventory & Audit Logs       │
│  - Transfer Requests Queue      │
│  - Database (Postgres / Mongo)  │
└────────────────┬────────────────┘
                 │ Internal REST / gRPC
                 ▼
┌─────────────────────────────────┐
│  Python AI / Optimization (ML)  │
│  - Time-series Demand Forecast  │
│  - Expiry & Stockout Risk Model │
│  - Multi-facility Redistribution│
└─────────────────────────────────┘
```

---

## 5. Expected Backend API Integration

*(Note: Endpoints labeled with **[To be finalized by backend team]** represent contracts expected by the frontend workflows).*

### 5.1. Inventory API
- **`GET /api/medicines`** `[To be finalized by backend team]`
  - **Purpose**: Fetch medicine catalog with current available stock.
  - **Response**: Array of medicine items with stock counts, unit types, and known batch IDs.
- **`POST /api/entries`** `[To be finalized by backend team]`
  - **Purpose**: Record new incoming stock delivery (`type: "stock"`).
  - **Request Body**:
    ```json
    {
      "type": "stock",
      "medicineId": "med-amox-500",
      "batchId": "AMX-8102",
      "quantity": 2000,
      "expiryDate": "2027-06-30",
      "dateReceived": "2026-10-08"
    }
    ```
- **`GET /api/entries/recent`** `[To be finalized by backend team]`
  - **Purpose**: Returns the latest 5 to 10 entries (received shipments, usage draws, and supply requests) for the signed-in facility.

### 5.2. Medicine Usage API
- **`POST /api/entries`** (or `POST /api/usage`) `[To be finalized by backend team]`
  - **Purpose**: Record clinical ward consumption.
  - **Request Body**:
    ```json
    {
      "type": "usage",
      "medicineId": "med-salb-100",
      "unitsUsed": 180,
      "date": "2026-10-08",
      "emergencyCases": 14
    }
    ```

### 5.3. Inter-Hospital Stock Request API
- **`POST /api/requests`** `[To be finalized by backend team]`
  - **Purpose**: Broadcast request for urgent medicines to network hospitals.
  - **Request Body**:
    ```json
    {
      "medicineId": "med-amox-500",
      "quantityRequired": 1600,
      "neededBy": "2026-10-14",
      "urgency": "Urgent" // "Normal" | "Urgent" | "Critical"
    }
    ```

### 5.4. Demand Forecast API
- **`GET /api/forecast/demand`** `[To be finalized by backend team]`
  - **Query Params**: `?timeRange=14d` (or `30d`, `90d`), `?medicineId=all`
  - **Response**: Time-series arrays with actual consumption and predicted demand values.

### 5.5. Shortage Risk API
- **`GET /api/risks/shortages`** `[To be finalized by backend team]`
  - **Purpose**: Returns medicines where projected demand exceeds current stock + scheduled deliveries within lead time.

### 5.6. Expiry Risk API
- **`GET /api/risks/expiry`** `[To be finalized by backend team]`
  - **Purpose**: Returns batches whose expiry date precedes projected local consumption (candidates for network transfer).

### 5.7. Redistribution API
- **`GET /api/transfers/recommendations`** `[To be finalized by backend team]`
  - **Purpose**: Network balancing proposals (source facility, target facility, medicine, quantity, priority).
- **`POST /api/transfers`** `[To be finalized by backend team]`
  - **Purpose**: Confirm and dispatch a recommended inter-facility transfer.

---

## 6. Expected Data Schemas

### Medicine Item
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier (e.g. `"med-amox-500"`) |
| `name` | `string` | Trade/generic name (e.g. `"Amoxicillin 500mg"`) |
| `unit` | `string` | Unit of measure (`"tablets"`, `"vials"`, `"ampoules"`) |
| `currentStock` | `number` | Real-time units currently in facility inventory |
| `expectedDemand14Days` | `number` | Forecast demand for the upcoming 14-day window |
| `usualRequestAmount` | `number` | Normal baseline request threshold |
| `existingBatches` | `string[]`| Known lot numbers already registered |

### Hospital Profile (Session Context)
| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | Facility legal name (`"Hospital A (Central General)"`) |
| `shortName` | `string` | UI badge label (`"Hospital A"`) |
| `beds` | `number` | Certified operational inpatient bed count (`450`) |
| `location` | `string` | Regional coordinates / cluster (`"North District · Sector 4"`) |

---

## 7. Python Intelligence & Optimization Service (BackendAI)

The Python service (`BackendAI/`) acts as the computational engine for supply intelligence:
1. **Time-Series Forecasting**: Ingests historical daily ward draw logs (`unitsUsed`, `emergencyCases`, seasonal markers) to generate projected demand curves per facility and per medicine SKU.
2. **Stockout Risk Classifier**: Computes probability of depletion before replenishment based on supplier delivery lead times and ward draw volatility.
3. **Surplus Expiry Optimizer**: Flags high-risk batches where expiration date occurs before local demand consumes the batch.
4. **Network Graph Balancing**: Formulates transfer recommendations across the 6 regional cluster facilities using linear programming to minimize transport cost and maximize life-saving availability.

---

## 8. Environment Variables

### Frontend (`Frontend/.env`)
```bash
VITE_API_BASE_URL=http://localhost:5000/api
```

### Backend (`Backend/.env`)
```bash
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
AI_SERVICE_URL=http://localhost:8000
DATABASE_URL=postgresql://user:password@localhost:5432/medsupply
```

---

## 9. Git & Development Workflow

1. **Branch Hygiene**: Work on designated feature branches (`<your-name>`) and do not force-push to `main`.
2. **Lockfile Management**: Run `npm install` inside `Frontend/` after pulling or merging branches to ensure new dependencies (such as routing and icon libraries) are synchronized in `node_modules`.
3. **Build Validation**: Always verify client builds pass before committing:
   ```bash
   cd Frontend && npm run build
   ```
