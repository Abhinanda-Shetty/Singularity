<div align="center">

# 🌐 SINGULARITY

### AI for Medical Supply Intelligence

**Predict before it happens.** Forecast medicine demand, detect shortage and expiry risk, and recommend practical stock redistribution between healthcare facilities.

</div>

---

## 📌 Table of Contents

- [The Problem](#-the-problem)
- [What Singularity Does](#-what-singularity-does)
- [System Architecture](#-system-architecture)
- [Runtime Flow](#-runtime-flow)
- [Tech Stack](#-tech-stack)
- [How the ML Works](#-how-the-ml-works)
- [Redistribution Engine](#-redistribution-engine)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Design Principles](#-design-principles)
- [Roadmap](#-roadmap)
- [Known Limitations](#-known-limitations)

---

## 🚨 The Problem

Hospitals run out of critical medicines while a nearby facility holds surplus that quietly expires. Stock decisions are usually reactive: someone notices a shortage *after* it happens.

Singularity answers one question ahead of time:

> **What is needed, where, and when will it run out?**

---

## ✨ What Singularity Does

| Capability | Description |
|---|---|
| 📈 **Demand forecasting** | XGBoost predicts future demand per hospital and medicine |
| ⏳ **Stock-out prediction** | Estimates days until stock runs out |
| 🗑️ **Expiry and wastage detection** | Flags batches likely to expire unused |
| 🏥 **Facility prioritisation** | Ranks shortages by patient load, emergency demand and criticality |
| 🔁 **Redistribution optimiser** | PuLP recommends which hospital sends how much to whom |
| 🚚 **Transport feasibility** | OSRM checks that a transfer arrives before expiry |
| 💬 **LLM assistant** | Plain-language answers on the dashboard |

---

## 🏗️ System Architecture

```mermaid
flowchart TB
    U(["👩‍⚕️ Hospital Staff<br/>Supply Manager"])

    subgraph APP["🌐  APPLICATION LAYER"]
        direction LR
        P["React Dashboard<br/>Leaflet Map"]
        O["FastAPI<br/>REST APIs"]
        Q["LLM Assistant"]
    end

    subgraph DATA["🗄️  DATA LAYER"]
        direction LR
        A["Hospital Inventory<br/>and Demand Data"]
        B[("PostgreSQL<br/>Source of Truth")]
        A --> B
    end

    subgraph AI["🤖  AI AND ANALYTICS"]
        direction LR
        C["Data Processing<br/>Pandas + Features"]
        D["XGBoost<br/>Demand Forecast"]
        E["Predicted<br/>Demand"]
        F["Stock-out<br/>Risk"]
        G["Expiry and<br/>Wastage Analysis"]
        C --> D
        D --> E
        D --> F
    end

    subgraph DEC["⚙️  DECISION AND OPTIMISATION"]
        direction LR
        H["Supply-Demand<br/>Gap"]
        I["Surplus<br/>Hospitals"]
        J["Deficit<br/>Hospitals"]
        K["Priority<br/>Engine"]
        L["PuLP<br/>Redistribution Optimiser"]
        M["OSRM + OpenStreetMap<br/>Distance and ETA"]
        N["Recommended Transfers<br/>with reasons"]
        H --> I
        H --> J
        J --> K
        I --> L
        K --> L
        L <--> M
        L --> N
    end

    U --> P
    P <--> O
    O --> Q
    Q --> P

    B --> C
    B --> G
    E --> H
    F --> H
    G --> H
    B --> L

    N --> O
    E --> O
    F --> O
    G --> O
    O --> B

    classDef user fill:#F1F5F9,stroke:#475569,stroke-width:2px,color:#0F172A;
    classDef data fill:#DBEAFE,stroke:#2563EB,stroke-width:2px,color:#1E3A8A;
    classDef ai fill:#EDE9FE,stroke:#7C3AED,stroke-width:2px,color:#4C1D95;
    classDef dec fill:#FFEDD5,stroke:#EA580C,stroke-width:2px,color:#7C2D12;
    classDef app fill:#D1FAE5,stroke:#059669,stroke-width:2px,color:#064E3B;

    class U user;
    class A,B data;
    class C,D,E,F,G ai;
    class H,I,J,K,L,M,N dec;
    class P,O,Q app;

    style APP fill:#ECFDF5,stroke:#059669,stroke-width:2px,color:#064E3B
    style DATA fill:#EFF6FF,stroke:#2563EB,stroke-width:2px,color:#1E3A8A
    style AI fill:#F5F3FF,stroke:#7C3AED,stroke-width:2px,color:#4C1D95
    style DEC fill:#FFF7ED,stroke:#EA580C,stroke-width:2px,color:#7C2D12
```

---

## 🔄 Runtime Flow

What happens when a new inventory event arrives:

```mermaid
sequenceDiagram
    autonumber
    actor S as Staff
    participant D as React Dashboard
    participant A as FastAPI
    participant DB as PostgreSQL
    participant ML as XGBoost Model
    participant OP as PuLP Optimiser
    participant R as OSRM

    S->>D: Update stock or view risks
    D->>A: Request
    A->>DB: Save event, build current features

    rect rgb(237, 233, 254)
    Note over A,ML: Forecasting (no retraining)
    A->>ML: Load model.pkl and predict
    ML-->>A: Predicted demand and days to stock-out
    end

    rect rgb(255, 237, 213)
    Note over A,R: Decision and optimisation
    A->>OP: Gaps, priorities, expiry, safety stock
    OP->>R: Distance and ETA for candidate transfers
    R-->>OP: Travel times
    OP-->>A: Feasible transfers with reasons
    end

    A->>DB: Store forecasts and recommendations
    A-->>D: Risks, transfers, explanations
    D-->>S: Show what is at risk, where, and what to move
```

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React.js, Tailwind CSS, Leaflet |
| **Backend** | Python, FastAPI, REST |
| **ML** | XGBoost, Pandas, NumPy, scikit-learn, SHAP |
| **Optimisation** | PuLP |
| **Routing** | OSRM, OpenStreetMap |
| **Database** | PostgreSQL |
| **Assistant** | LLM |

---

## 🤖 How the ML Works

The model learns:

> *Given current stock, consumption, patient load, emergency demand, outbreak signals and medicine / facility context, predict future medicine demand.*

**Target:** `future_demand`

```mermaid
flowchart LR
    A["Historical +<br/>Current Data"] --> B["Pandas<br/>Preprocessing"]
    B --> C["Feature<br/>Engineering"]
    C --> D{"Chronological<br/>80 / 20 Split"}
    D -->|"first 80%"| E["Train"]
    D -->|"last 20%"| F["Test"]
    E --> G["scikit-learn<br/>Pipeline"]
    G --> H["XGBoost<br/>Regressor"]
    H --> I["models/model.pkl"]
    F --> J["Evaluate<br/>MAE / RMSE / R²"]
    H --> J
    I --> K["Predict on new<br/>hospital data"]
    K --> L["Predicted demand<br/>and stock-out risk"]

    classDef step fill:#EDE9FE,stroke:#7C3AED,stroke-width:2px,color:#4C1D95;
    classDef split fill:#FEF3C7,stroke:#D97706,stroke-width:2px,color:#78350F;
    classDef out fill:#D1FAE5,stroke:#059669,stroke-width:2px,color:#064E3B;
    class A,B,C,E,F,G,H,J step;
    class D split;
    class I,K,L out;
```

### Feature groups

| Group | Features |
|---|---|
| Inventory | `current_stock`, `safety_stock` |
| Demand | `consumption` |
| Healthcare load | `patient_load`, `emergency_demand` |
| Signals | `outbreak_indicator` |
| Supply | `lead_time_days` |
| Context | `region_type`, `medicine_category` |
| Time | `month`, `week_of_year`, `quarter` |

### Prediction output

`python src/predict.py` produces, per hospital and medicine:

`predicted_future_demand` · `predicted_daily_demand` · `current_stock` · `safety_stock` · `days_to_stockout`

> The model is **not retrained on every transaction**. Predictions run on each important inventory event; retraining happens weekly or monthly once enough new history exists.

### Model results

| Metric | Held-out test set |
|---|---|
| MAE | _fill in from `train.py` output_ |
| RMSE | _fill in from `train.py` output_ |
| R² | _fill in from `train.py` output_ |

> ⚠️ Use the **Test Metrics** printed by `train.py` (chronological held-out 20%). Scores from `predict.py` on the training CSV are in-sample and shouldn't be reported as accuracy.

---

## 🔁 Redistribution Engine

```mermaid
flowchart LR
    A["Predicted<br/>Demand"] --> B["Stock + Safety Stock<br/>vs Demand"]
    B --> C["Supply-Demand<br/>Gap"]
    C --> D["Surplus<br/>Hospitals"]
    C --> E["Deficit<br/>Hospitals"]
    E --> F["Priority<br/>Engine"]
    D --> G["PuLP<br/>Optimiser"]
    F --> G
    H["Batch Expiry<br/>Dates"] --> G
    I["OSRM<br/>Distance + ETA"] --> J{"Arrives before<br/>expiry?"}
    J -->|"yes"| G
    J -->|"no"| X["❌ Reject transfer"]
    G --> K["✅ Recommended<br/>Transfers + reasons"]

    classDef calc fill:#DBEAFE,stroke:#2563EB,stroke-width:2px,color:#1E3A8A;
    classDef dec fill:#FFEDD5,stroke:#EA580C,stroke-width:2px,color:#7C2D12;
    classDef gate fill:#FEF3C7,stroke:#D97706,stroke-width:2px,color:#78350F;
    classDef good fill:#D1FAE5,stroke:#059669,stroke-width:2px,color:#064E3B;
    classDef bad fill:#FEE2E2,stroke:#DC2626,stroke-width:2px,color:#7F1D1D;

    class A,B,C,H calc;
    class D,E,F,G,I dec;
    class J gate;
    class K good;
    class X bad;
```

**Example output**

```text
Hospital C → Hospital A : 1,800 units
Hospital C → Hospital B :   700 units
```

PuLP optimises the *decision*. It is not an ML model and needs no training.

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js (for the dashboard)
- PostgreSQL

### Setup

```bash
git clone https://github.com/Abhinanda-Shetty/Singularity.git
cd Singularity
git checkout abhi
cd BackendAI

python -m venv .venv
```

**Windows:** `.venv\Scripts\activate`  **Linux / macOS:** `source .venv/bin/activate`

```bash
pip install pandas numpy scikit-learn xgboost joblib fastapi uvicorn pulp shap requests
```

### Train and predict

```bash
python src/train.py      # trains, prints test metrics, saves models/model.pkl
python src/predict.py    # writes data/predictions.csv
```

### Run the API

```bash
uvicorn api.main:app --reload
```

---

## 📁 Project Structure

```text
BackendAI/
├── data/
│   ├── medical_demand_training_90.csv
│   ├── test_predictions.csv
│   └── predictions.csv
├── models/
│   └── model.pkl
├── src/
│   ├── preprocessing.py
│   ├── features.py
│   ├── train.py
│   ├── predict.py
│   ├── forecasting.py
│   ├── stockout.py
│   ├── expiry.py
│   ├── priority.py
│   └── optimizer.py
├── api/
│   └── main.py
├── requirements.txt
└── README.md
```

---

## 🧭 Design Principles

- **Prediction first, action second.**
- Never retrain per transaction.
- Always protect hospital **safety stock**.
- Never transfer expired or infeasible stock.
- Price is never the primary medical-priority rule.
- Prioritise by patient load, emergency demand, stock-out urgency, medicine criticality and alternatives.
- Keep hard safety constraints separate from soft optimisation preferences.
- **Explain every recommendation.**
- Keep an audit trail of forecasts, decisions and transfers.

---

## 🛣️ Roadmap

- [ ] Add per-pair demand history features (lags, rolling mean / std)
- [ ] Rolling-origin cross-validation and naive baselines
- [ ] Quantile forecasts (P10 / P50 / P90) for uncertainty-based safety stock
- [ ] Lead-time-aware stock-out alerts and reorder suggestions
- [ ] Substitute-aware shortage handling using medicine master data
- [ ] FEFO (first-expiry-first-out) redistribution with batch-level expiry
- [ ] SHAP explanations on the dashboard
- [ ] What-if simulator (outbreak surge, supplier delay)
- [ ] Drift monitoring and automated retraining trigger

---

## ⚠️ Known Limitations

- The prototype dataset has **90 rows**, so the held-out test set is tiny and scores are noisy.
- The dataset is **synthetic**. Results reflect the generator, not real hospital behaviour, and need validation on real data.
- `predicted_daily_demand` is `future_demand / 7` (flat across the horizon).
- `days_to_stockout` does not yet account for lead time or incoming orders.
- The medicine master data describes medicines but is not a demand-forecasting dataset.

---

<div align="center">

**Singularity** · Predict before it happens

</div>
