## Tech Stack

```mermaid
flowchart LR

    subgraph FRONTEND["🎨 FRONTEND"]
        A["React.js"]
        B["JavaScript"]
        C["Tailwind CSS"]
        D["Leaflet"]
    end

    subgraph BACKEND["⚡ BACKEND"]
        E["FastAPI"]
        F["Python"]
        G["REST APIs"]
    end

    subgraph AI["🤖 AI / ML"]
        H["XGBoost"]
        I["Pandas + NumPy"]
        J["Scikit-learn"]
        K["SHAP"]
    end

    subgraph OPT["⚙️ OPTIMIZATION"]
        L["PuLP"]
        M["OSRM"]
        N["OpenStreetMap"]
    end

    subgraph DATABASE["🗄️ DATABASE"]
        O[("PostgreSQL")]
    end

    subgraph ASSISTANT["💬 AI ASSISTANT"]
        P["LLM"]
    end

    A --> E
    D --> E
    E --> O

    E --> H
    E --> L

    H --> I
    H --> J
    H --> K

    L --> M
    M --> N

    E --> P

    %% Styling
    classDef frontend fill:#E0F2FE,stroke:#0284C7,stroke-width:2px,color:#111827;
    classDef backend fill:#ECFDF5,stroke:#059669,stroke-width:2px,color:#111827;
    classDef ai fill:#F3E8FF,stroke:#9333EA,stroke-width:2px,color:#111827;
    classDef optimization fill:#FFF7ED,stroke:#EA580C,stroke-width:2px,color:#111827;
    classDef database fill:#FEF2F2,stroke:#DC2626,stroke-width:2px,color:#111827;
    classDef assistant fill:#FDF4FF,stroke:#C026D3,stroke-width:2px,color:#111827;

    class A,B,C,D frontend;
    class E,F,G backend;
    class H,I,J,K ai;
    class L,M,N optimization;
    class O database;
    class P assistant;

    style FRONTEND fill:#F0F9FF,stroke:#0284C7,stroke-width:2px
    style BACKEND fill:#F0FDF4,stroke:#059669,stroke-width:2px
    style AI fill:#FAF5FF,stroke:#9333EA,stroke-width:2px
    style OPT fill:#FFF7ED,stroke:#EA580C,stroke-width:2px
    style DATABASE fill:#FEF2F2,stroke:#DC2626,stroke-width:2px
    style ASSISTANT fill:#FDF4FF,stroke:#C026D3,stroke-width:2px
