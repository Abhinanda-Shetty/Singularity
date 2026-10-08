## System Architecture

```mermaid
flowchart TD

    %% =========================
    %% DATA LAYER
    %% =========================
    subgraph DATA["🗄️ DATA LAYER"]
        A["Hospital Data"]
        B[("PostgreSQL")]
        A --> B
    end

    %% =========================
    %% AI / ANALYTICS
    %% =========================
    subgraph AI["🤖 AI & ANALYTICS"]
        C["Data Processing<br/>Python + Pandas"]
        D["XGBoost<br/>Demand Forecasting"]
        E["Predicted Demand"]
        F["Stock-out Prediction"]
        G["Expiry & Wastage Analysis"]

        C --> D
        D --> E
        D --> F
    end

    %% =========================
    %% DECISION ENGINE
    %% =========================
    subgraph DECISION["⚙️ DECISION & OPTIMIZATION"]
        H["Supply-Demand Analysis"]
        I["Surplus Hospitals"]
        J["Deficit Hospitals"]
        K["Priority Engine"]
        L["Patient Load<br/>Emergency Demand<br/>Criticality<br/>Alternatives"]
        M["PuLP<br/>Redistribution Optimizer"]
        N["OSRM / OpenStreetMap<br/>Distance + Travel Time"]
        O["Recommended Transfers"]

        H --> I
        H --> J
        J --> K
        K --> L
        I --> M
        L --> M
        M --> N
        N --> M
        M --> O
    end

    %% =========================
    %% APPLICATION
    %% =========================
    subgraph APP["🌐 APPLICATION LAYER"]
        P["FastAPI Backend"]
        Q["React Dashboard"]
        R["LLM Assistant"]

        P --> Q
        P --> R
        R --> Q
    end

    %% DATA FLOW
    B --> C
    B --> G

    E --> H
    F --> H
    G --> H

    B --> M

    O --> P
    E --> P
    F --> P
    G --> P

    %% DASHBOARD
    Q --> S["📦 Inventory"]
    Q --> T["📈 Demand Forecast"]
    Q --> U["⚠️ Shortage Risk"]
    Q --> V["⏳ Expiry Risk"]
    Q --> W["🚚 Redistribution"]
    Q --> X["🏥 Priority Facilities"]

    %% =========================
    %% STYLING
    %% =========================

    classDef data fill:#E8F1FF,stroke:#2563EB,stroke-width:2px,color:#111827;
    classDef ai fill:#F3E8FF,stroke:#9333EA,stroke-width:2px,color:#111827;
    classDef decision fill:#FFF7ED,stroke:#EA580C,stroke-width:2px,color:#111827;
    classDef app fill:#ECFDF5,stroke:#059669,stroke-width:2px,color:#111827;
    classDef output fill:#FEF2F2,stroke:#DC2626,stroke-width:2px,color:#111827;

    class A,B data;
    class C,D,E,F,G ai;
    class H,I,J,K,L,M,N,O decision;
    class P,Q,R app;
    class S,T,U,V,W,X output;

    style DATA fill:#F8FAFC,stroke:#2563EB,stroke-width:2px
    style AI fill:#FAF5FF,stroke:#9333EA,stroke-width:2px
    style DECISION fill:#FFF7ED,stroke:#EA580C,stroke-width:2px
    style APP fill:#ECFDF5,stroke:#059669,stroke-width:2px
