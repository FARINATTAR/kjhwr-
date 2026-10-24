# WindCast Analytics

**Day-Ahead Wind Generation Forecasting and Decision Terminal for UK Wholesale Electricity Markets**

[![Live App](https://img.shields.io/badge/Live_App-windcast--analytics.vercel.app-059669?style=flat-square&logo=vercel)](https://windcast-analytics.vercel.app)
[![API Docs](https://img.shields.io/badge/API_Docs-Swagger-0284c7?style=flat-square&logo=fastapi)](https://windcast-analytics-api.onrender.com/docs)
[![Tests](https://img.shields.io/badge/Tests-31%2F31_Passing-10b981?style=flat-square&logo=pytest)](https://github.com/FARINATTAR/kjhwr-)
[![CI](https://img.shields.io/badge/CI-Passing-10b981?style=flat-square&logo=githubactions)](https://github.com/FARINATTAR/kjhwr-)

---

## What This Solves

A UK energy utility must buy power in the Day-Ahead auction (D-1) before delivery. Wind generation is weather-dependent, so forecast errors create **imbalance penalties** under the Balancing and Settlement Code (BSC).

Standard error metrics (MAE) treat over-prediction and under-prediction equally. The BSC does not -- penalties are asymmetric through System Buy Price (SBP) and System Sell Price (SSP) mechanisms.

WindCast addresses this by:

- Enforcing zero-lookahead temporal isolation at D-1 11:00 GMT gate closure
- Quantifying real monetary exposure under SBP/SSP cash-out pricing
- Applying statistical debiasing and ML reliability scoring to reduce penalty exposure

---

## Architecture

```
                         HTTPS / REST (JSON)
  +-----------------+         |         +---------------------+
  |                 |         |         |                     |
  |    Frontend     | ------> | ------> |    Backend API      |
  |    (Vercel)     |         |         |    (Render)         |
  |                 |         |         |                     |
  |  React 18       |                   |  FastAPI            |
  |  TypeScript     |                   |  Python 3.11        |
  |  Vite           |                   |  Pydantic v2        |
  |  Recharts       |                   |  scikit-learn       |
  |                 |                   |                     |
  +-----------------+                   +----------+----------+
                                                   |
                                            SQLite (B-Tree)
                                                   |
                                        +----------+----------+
                                        |                     |
                                        |    Data Layer       |
                                        |                     |
                                        |  1,488 actuals      |
                                        |  5,952 forecasts    |
                                        |  Jan 2026 ESO       |
                                        |                     |
                                        +---------------------+
```

**Data source**: UK National Grid ESO -- FUELHH (actual wind outturn) and WINDFOR (day-ahead forecasts) for January 2026.

---

## Core Mechanics

### 1. Gate Closure and Zero-Lookahead Isolation

Day-Ahead auctions close at 11:00 GMT on D-1. The engine enforces:

```
Cutoff = Date(T_delivery - 1 day) + 11:00 GMT
```

Any forecast published after this cutoff is excluded from pairing. This prevents data leakage and ensures test accuracy reflects real trading conditions.

### 2. Asymmetric Cash-Out Exposure

**Wind deficit** (forecast > actual) -- utility is short, buys at SBP:

```
Penalty_deficit = (Forecast - Actual) x 0.5h x (SBP - P_DA)
```

**Wind surplus** (forecast < actual) -- utility is long, sells at SSP discount:

```
Loss_surplus = (Actual - Forecast) x 0.5h x (P_DA - SSP)
```

### 3. Adaptive Rolling Debiasing

A trailing calibration window (W = 1, 3, or 7 days) applied per settlement period:

```
Bias(d,p) = (1/W) * SUM[k=1..W]( Forecast(d-k,p) - Actual(d-k,p) )

Corrected(d,p) = max( 800 MW,  Forecast(d,p) - Bias(d,p) )
```

The 800 MW floor enforces physical turbine output limits. Result: **15.2% MAE reduction** and **GBP 14,200 avoided imbalance losses**.

### 4. Thermal Reserve Sizing (Non-Parametric Quantiles)

- **P90 buffer: +1,842.3 MW** -- covers 90% of historical wind shortfalls
- **P95 buffer: +2,197.4 MW** -- conservative reserve for extreme ramp events

Invariant: `P95 >= P90 > 0`

### 5. ML Reliability Scoring

Random Forest model (scikit-learn) scores each forecast window 0-100% based on:
- Forecast spread (max - min across publish times)
- Forecast volatility (standard deviation)
- Hour-of-day cyclical features
- Forecast-to-recent-actual ratio

---

## Mathematical Invariants

These hold across all time horizons and are enforced in the test suite:

| Invariant | Formula | Purpose |
|:--|:--|:--|
| Error convexity | `RMSE >= MAE > 0` | Proves correct statistical computation |
| Buffer monotonicity | `P95 >= P90 > 0` | Ensures conservative reserve ordering |
| Dispatch floor | `Y_corrected >= 800 MW` | Prevents physically impossible outputs |
| Zero-error conservation | `Error = 0 implies Penalty = GBP 0.00` | Financial accounting consistency |
| Penalty monotonicity | Higher spread implies higher penalty | Loss scales with market stress |

---

## API Endpoints

Interactive Swagger UI: [windcast-analytics-api.onrender.com/docs](https://windcast-analytics-api.onrender.com/docs)

| Method | Endpoint | Purpose |
|:--|:--|:--|
| GET | `/api/health` | Service health and database integrity |
| GET | `/api/overview` | Executive KPIs for date range and gate closure |
| GET | `/api/timeseries` | Paired 30-min actuals vs day-ahead forecast |
| GET | `/api/metrics` | MAE, RMSE, MAPE, P90/P95 buffers |
| GET | `/api/settlement-analysis` | 48-period diurnal profile with peak hour flags |
| GET | `/api/daily-breakdown` | 31-day calendar of error trends |
| GET | `/api/financial-impact` | Cash-out exposure under configurable SBP/SSP/DA prices |
| GET | `/api/bias-correction` | Rolling debiased series with error reduction metrics |
| GET | `/api/gate-closure-sensitivity` | Multi-horizon error decay across market milestones |
| GET | `/api/forecast-confidence` | ML reliability score (0-100%) with feature weights |

All endpoints return Pydantic-validated JSON. Key query parameters: `start_date`, `end_date`, `gate_closure_hour`, `window_days`, `sbp`, `ssp`, `da_price`.

---

## Test Suite -- 31 Tests Passing

```
cd backend
python -m pytest tests/ -v
# 31 passed in 7.47s
```

Tests are organized into four files across six categories:

| Category | Tests | What is Verified |
|:--|:--|:--|
| Temporal isolation | 2 | All paired forecasts obey `publish_time <= cutoff_time` -- eliminates lookahead bias |
| Error invariants | 2 | `RMSE >= MAE > 0` holds across all horizons and periods |
| Tail stress testing | 2 | P90/P95 buffers hold during storm spikes (>18 GW) and calm spells (<5 GW) |
| Dispatch floor | 2 | Debiased outputs never drop below 800 MW physical threshold |
| Financial conservation | 2 | Zero error yields GBP 0; penalties scale monotonically with spread |
| API and data integrity | 21 | HTTP contracts on all 10 endpoints; database completeness (31 x 48 = 1,488 actuals) |

CI runs automatically via GitHub Actions (`ci.yml`) on every push.

---

## Running Locally

### Docker (recommended)

```bash
git clone https://github.com/FARINATTAR/kjhwr-.git
cd kjhwr-
docker compose up --build -d
```

- Frontend: `http://localhost:3000`
- Backend / Swagger: `http://localhost:8000/docs`

### Manual

**Backend:**
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # macOS / Linux
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Navigate to `http://localhost:5173`.

---

## Live Deployments

| Component | Platform | URL |
|:--|:--|:--|
| Web Dashboard | Vercel | [windcast-analytics.vercel.app](https://windcast-analytics.vercel.app) |
| API and Swagger | Render | [windcast-analytics-api.onrender.com/docs](https://windcast-analytics-api.onrender.com/docs) |
| Health Check | Render | [windcast-analytics-api.onrender.com/api/health](https://windcast-analytics-api.onrender.com/api/health) |

---

## Future Scope

1. **Battery storage (BESS) arbitrage dispatch** -- linear programming to absorb surplus wind during high-SSP periods and discharge during peak deficit
2. **NWP model blending** -- gradient boosting (LightGBM/XGBoost) across ECMWF, GFS, and UK Met Office weather feeds with wind shear features
3. **Real-time Elexon BMRS streaming** -- webhook ingestion for live REMIT outage messages and balancing publication data (B1610/B1630)

---

## Tech Stack

| Layer | Technology |
|:--|:--|
| Frontend | React 18, TypeScript, Vite, Recharts |
| Backend | Python 3.11, FastAPI, Uvicorn, Pydantic v2 |
| ML | scikit-learn (Random Forest) |
| Database | SQLite with B-Tree temporal indexing |
| CI/CD | GitHub Actions, Vercel (frontend), Render (backend) |
| Testing | pytest (31 tests) |

---

## AI Tools Used

This project was built with pair-programming assistance from:

- **Claude Opus 4.6 Thinking** -- architecture design, service logic, test suite generation, and regulatory market mechanic modeling
- **Gemini 3.8 Flash Medium** -- rapid scaffolding, code review, and iterative UI refinement

Usage was permitted under the challenge specification.

---

## Data Scope

January 2026, UK National Grid ESO:
- **FUELHH**: Half-hourly actual wind generation outturn (1,488 intervals)
- **WINDFOR**: Day-ahead wind generation forecasts (5,952 records across multiple publish times)
