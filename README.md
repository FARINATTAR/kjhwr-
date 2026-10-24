# WindCast Energy Analytics Platform
### Day-Ahead Wind Generation Forecasting & Power Trading Decision System

---

## Executive Summary

The WindCast Energy Analytics Platform is an institutional-grade forecasting evaluation and commercial decision support system designed for Great Britain (GB) power market participants. Operating within the Balancing and Settlement Code (BSC) framework governed by Elexon and National Grid ESO, the platform bridges numerical weather prediction (NWP) forecasting data with day-ahead wholesale power trading and dispatch hedging.

Wholesale power traders, portfolio dispatchers, and risk managers face a persistent challenge: standard forecast metrics (e.g., Mean Absolute Error in Megawatts) fail to capture the asymmetric financial penalties incurred in real-time settlement. This platform provides an end-to-end framework to ingest actual generation outturn, reconstruct decision-horizon forecasts without lookahead bias, quantify monetary exposure under System Buy and System Sell cash-out prices, and apply adaptive statistical debiasing prior to auction submission.

---

## Market Mechanics & Theoretical Framework

### Day-Ahead Gate Closure & Lookahead Bias Prevention

Under standard UK power exchange mechanisms (e.g., EPEX SPOT and Nord Pool UK), the Day-Ahead (DA) auction clears on Day D-1 at 11:00 GMT for physical delivery across the 48 half-hour settlement periods of Day D.

```
                    Timeline: Decision to Physical Settlement

      Day D-1 (11:00 GMT)                                Day D (Delivery)
───────────────┬───────────────────────────────┬─────────────────────────────────►
               │                               │
        Gate Closure Cutoff             Settlement Period 1             Settlement Period 48
        Bids Locked Firm                (00:00 - 00:30 GMT)             (23:30 - 24:00 GMT)
        Forecast Filter Applied         Physical Delivery Starts        End of Delivery Day
```

To eliminate lookahead bias in historical evaluations, the system enforces a strict time-filtering constraint:
For any delivery interval starting at $T_{\text{delivery}}$ on Day D:

$$\text{Cutoff Time} = \text{Date}(T_{\text{delivery}} - 1\text{ day}) + 11:00\text{ GMT}$$

$$\text{Active DA Forecast} = \arg\max_{t \le \text{Cutoff Time}} \left( \text{GenerationForecast}(T_{\text{delivery}}, t) \right)$$

Any forecast published after 11:00 GMT on D-1 is strictly sequestered from the day-ahead procurement decision baseline.

---

## Core Analytical Capabilities

### 1. Imbalance Settlement Financial Impact Engine

Standard operational metrics treat over-forecasts and under-forecasts symmetrically. In wholesale power settlement, cash-out mechanisms under BSC Section T produce non-linear, asymmetric monetary penalties:

- **Wind Deficit (Over-Forecast: Forecast > Actual)**:
  The utility has under-procured thermal backup in the day-ahead auction. To balance the grid deficit, the desk must purchase balancing energy at the System Buy Price (SBP), which typically clears at a substantial premium over the day-ahead clearing price:
  
  $$\text{Imbalance Penalty}_{\text{deficit}} = (\text{Forecast} - \text{Actual}) \times 0.5\,\text{h} \times (\text{SBP} - P_{\text{DA}})$$

- **Wind Surplus (Under-Forecast: Forecast < Actual)**:
  The utility has over-procured base generation. The excess volume spills into the balancing mechanism and is remunerated at the System Sell Price (SSP), which typically clears at a deep discount:
  
  $$\text{Imbalance Penalty}_{\text{surplus}} = (\text{Actual} - \text{Forecast}) \times 0.5\,\text{h} \times (P_{\text{DA}} - \text{SSP})$$

The engine computes aggregate portfolio exposure, interval cash-out averages, and tail-risk single-interval peak exposure under customizable price curves.

---

### 2. Statistical Bias-Correction Architecture

Raw meteorological numerical forecasts frequently exhibit persistent atmospheric and turbine power curve bias. The platform features an adaptive trailing-window debiasing engine:

For delivery date $d$ and settlement period $p \in [1, 48]$:

$$\text{Bias}_{d, p} = \frac{1}{W} \sum_{k=1}^{W} \left( \hat{Y}_{d-k, p} - Y_{d-k, p} \right)$$

$$\hat{Y}_{d, p}^{\text{corrected}} = \max\left( Y_{\text{floor}},\, \hat{Y}_{d, p} - \text{Bias}_{d, p} \right)$$

Where:
- $W$ denotes the configurable rolling calibration window (e.g., 3, 7, 14 days).
- $Y_{\text{floor}}$ enforces physical feasibility (800 MW baseline).

This debiasing layer demonstrates an immediate reduction in Mean Absolute Error (MAE) and eliminates systematic upward drift before bid submission.

---

### 3. Gate Closure Sensitivity & Information Decay

Deciding when to firm up commercial positions involves a fundamental tradeoff between liquidity and forecast accuracy. The sensitivity analysis module evaluates forecast degradation across operational milestones:

- D-1 07:00 GMT: Early morning preliminary position
- D-1 09:00 GMT: Nord Pool auction preparation
- D-1 11:00 GMT: EPEX SPOT DA auction gate closure (market standard)
- D-1 14:00 GMT: Post-auction secondary trading window
- D-1 17:00 GMT: Evening Final Physical Notification window
- D-1 22:00 GMT: Overnight thermal dispatch revision
- Intraday Rolling: 1-hour pre-delivery continuous position

This enables trading desks to quantify the economic value of information freshness and structure optimal dual-market participation strategies.

---

### 4. Non-Parametric Thermal Procurement Quantiles

To prevent unhedged short positions during low-wind anomalies, the platform calculates non-parametric deficit distributions:

- **P90 Procurement Buffer**: Thermal capacity required to cover 90% of observed wind shortfall events.
- **P95 Procurement Buffer**: Highly conservative reserve threshold for severe ramp-down events.

---

### 5. Settlement Period Diurnal Profiling

Evaluation across all 48 half-hour settlement periods identifies diurnal error profiles. Special operational flags isolate peak demand hours (Settlement Periods 34 to 38, 16:30 to 19:00 GMT), where system stress and cash-out volatility reach maximum levels.

---

### 6. Machine Learning Forecast Reliability & Uncertainty Scoring

To bridge meteorological forecasts with commercial trading actions, the platform features a lightweight Random Forest ensemble (`scikit-learn`):

- **Target Metric**: Predicts interval-by-interval absolute error uncertainty and converts it into a standardized **Forecast Reliability Score (0–100%)**.
- **Model Features**: Settlement period (diurnal time), Day-Ahead forecast volume (MW), day of the week, lead time to delivery (hours), and peak demand indicator.
- **Explainability**: Quantifies feature importance drivers (e.g. forecast generation magnitude accounts for ~68% of error variance, diurnal timing accounts for ~11%).
- **Operational Utility**: Classifies intervals into actionable trading tiers (High ≥80%, Medium 60–79%, Low <60%) and generates plain-English risk guidance for auction submission.

---

## Technical Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Client Presentation Layer                       │
│  React 18 / TypeScript / Vite / Recharts                               │
│  - Financial Imbalance Simulator with Parametric SBP/SSP Sliders      │
│  - Rolling Bias-Correction Analytical Engine                           │
│  - Multi-Horizon Gate Closure Sensitivity Curves                       │
│  - ML Forecast Reliability Lab & Feature Importance Inspector          │
│  - Diurnal Heatmap & 48-Period Settlement Distribution Profiler        │
│  - High-Volume CSV Export Facility                                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST (JSON)
┌───────────────────────────────────▼────────────────────────────────────┐
│                         Application API Layer                          │
│  FastAPI (Python 3.11) / Uvicorn / Pydantic v2 Models                  │
│  - Lookahead-free Temporal Filter Engine                               │
│  - Random Forest Forecast Uncertainty & Confidence Scorer             │
│  - Statistical Debiasing & Error Attribution Services                  │
│  - Cash-Out Exposure & Balancing Mechanism Price Calculators           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ SQLite Query Interface
┌───────────────────────────────────▼────────────────────────────────────┐
│                          Data Storage Layer                            │
│  SQLite with B-Tree Indices                                            │
│  - actual_generation (1,488 half-hour settlement intervals)            │
│  - forecast_generation (7,440 multi-publish NWP forecasts)             │
│  - Temporal Index: (start_time, publish_time DESC)                     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## API Specifications

All endpoints serve structured JSON responses validated against Pydantic schemas.

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/health` | Service health, target scope, and database record metrics |
| `GET` | `/api/overview` | Aggregated executive KPIs for specified date ranges and gate closures |
| `GET` | `/api/timeseries` | Granular 30-minute outturn paired with active DA gate closure forecasts |
| `GET` | `/api/metrics` | Quantitative accuracy metrics (MAE, RMSE, MAPE, NMAE, Ramps, Buffers) |
| `GET` | `/api/settlement-analysis` | 48-period diurnal profile of errors, bias, and peak-hour metrics |
| `GET` | `/api/daily-breakdown` | Calendar day performance and daily error attribution |
| `GET` | `/api/financial-impact` | Imbalance cash-out exposure calculator with configurable SBP/SSP/DA prices |
| `GET` | `/api/bias-correction` | Rolling debiasing model evaluation, improvement percentages, and series |
| `GET` | `/api/gate-closure-sensitivity` | Multi-horizon error and monetary loss decay curves across gate closures |
| `GET` | `/api/forecast-confidence` | Random Forest ML reliability score (0-100%), feature importances, and tier schedule |


Interactive OpenAPI documentation is accessible at `/docs` when the backend service is active.

---

## Deployment & Operation

### Deployment with Docker Compose

Ensure Docker and Docker Compose are installed on the target host.

```bash
# Build and start all services in detached mode
docker compose up --build -d

# Verify service status
docker compose ps
```

- Web Interface: `http://localhost:3000`
- API Service & Swagger Documentation: `http://localhost:8000/docs`
- Health Endpoint: `http://localhost:8000/api/health`

To inspect container logs:
```bash
docker compose logs -f
```

---

### Local Environment Setup (Manual Execution)

#### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher with npm

#### 1. Backend Service
```bash
cd backend

# Initialize Python virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.\.venv\Scripts\activate
# Unix/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the application server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Frontend Interface
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Navigate to `http://localhost:5173` to access the application.

---

## Automated Verification & Test Suite

The system includes automated integration and unit test coverage verifying database consistency, metric invariants, temporal filters, and API contracts.

Execute the test suite from the `backend/` directory:

```bash
cd backend
.\.venv\Scripts\python.exe -m pytest -v
```

### Invariants Verified by Test Suite:
1. **Zero Lookahead Constraint**: Verifies that no forecast with `publish_time > cutoff` is returned in Day-Ahead evaluation sets.
2. **Mathematical Invariant Consistency**: Asserts $\text{RMSE} \ge \text{MAE} > 0$ across all timeframes.
3. **Database Completeness**: Guarantees exactly 1,488 outturn intervals across January 2026 ($31 \text{ days} \times 48 \text{ periods}$).
4. **Quantile Monotonicity**: Verifies $\text{P95 Buffer} \ge \text{P90 Buffer}$.
5. **Balancing Mechanism Bounds**: Asserts deficit penalties and surplus losses scale monotonically with cash-out spreads.

---

## Production Roadmap

1. **Battery Energy Storage System (BESS) Co-Optimization**:
   Integration of linear programming dispatch routines to co-locate storage assets with wind portfolios, automatically absorbing wind surplus during high-SSP spreads and discharging during deficit intervals.

2. **NWP Multi-Model Machine Learning Blending**:
   Gradient boosting (XGBoost/LightGBM) trained on meteorological features (wind shear, 100m geostrophic wind speed, atmospheric pressure gradients) to produce probabilistic density forecasts.

3. **Real-Time Elexon BMRS Webhook Ingestion**:
   Direct ingestion daemon for National Grid ESO REMIT messages and real-time Initial Balancing Publication (B1610/B1630) feeds.

---

*WindCast Energy Analytics Platform. Data scope: January 2026 UK National Grid / Elexon outturn.*
