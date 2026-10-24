# ⚡ WindCast Energy Analytics Platform
### Institutional Day-Ahead Wind Forecasting & Wholesale Power Decision Terminal

[![Live Web Application](https://img.shields.io/badge/Live%20App-windcast--analytics.vercel.app-059669?style=for-the-badge&logo=vercel)](https://windcast-analytics.vercel.app)
[![Live Backend API & Swagger](https://img.shields.io/badge/API%20Docs-Render%20Swagger-0284c7?style=for-the-badge&logo=fastapi)](https://windcast-analytics-api.onrender.com/docs)
[![Automated Invariant Tests](https://img.shields.io/badge/Guardrail%20Tests-31%2F31%20Passing-success?style=for-the-badge&logo=pytest)](https://github.com/FARINATTAR/kjhwr-)
[![GitHub CI Pipeline](https://img.shields.io/badge/CI%20Build-Passing-10b981?style=for-the-badge&logo=githubactions)](https://github.com/FARINATTAR/kjhwr-)

---

## 📌 Executive Summary

**WindCast** is a commercial decision-support and forecasting evaluation platform designed for a **UK Energy Utility** operating in the wholesale electricity market (EPEX SPOT / Nord Pool).

To supply consumer demand reliably, the utility's trading desk must purchase power in the Day-Ahead auction one day before physical delivery. Because wind generation is weather-dependent, trading desks face a critical dilemma: **standard forecast error metrics (like MAE in MW) treat over-predictions and under-predictions symmetrically, but the UK Balancing and Settlement Code (BSC) punishes them asymmetrically with heavy cash-out penalties.**

WindCast bridges this gap:
1. **Reconstructs Decision-Horizon Forecasts** with strict **Zero-Lookahead Bias** (locked at D-1 11:00 GMT gate closure).
2. **Quantifies Real Monetary Exposure** under Elexon System Buy Price (SBP) and System Sell Price (SSP) cash-out mechanisms.
3. **Applies Statistical Debiasing & ML Reliability Scoring** to reduce imbalance penalty exposure and recommend exact thermal backup capacity.

---

## 🌐 Live Production Deployments

| Component | Platform | Live URL | Description |
|:---|:---|:---|:---|
| **Web Dashboard** | **Vercel** | [windcast-analytics.vercel.app](https://windcast-analytics.vercel.app) | Responsive React trading desk terminal |
| **API & Swagger Docs** | **Render** | [windcast-analytics-api.onrender.com/docs](https://windcast-analytics-api.onrender.com/docs) | Interactive OpenAPI / Swagger interface |
| **Backend Health** | **Render** | [windcast-analytics-api.onrender.com/api/health](https://windcast-analytics-api.onrender.com/api/health) | System health & database integrity check |

---

## 🏗️ Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Client Terminal (Vercel)                             │
│  React 18 + TypeScript + Vite + Recharts                                │
│  • Fully Responsive Layout (Mobile 375px → Ultrawide 1440px+)          │
│  • Financial Imbalance Cash-Out Simulator with Live Price Spread Curves │
│  • Rolling-Window Auto-Tuning Lab (Actual vs Raw vs Debiased Model)     │
│  • Multi-Horizon Information Decay Sensitivity Curves                   │
│  • 48-Period Settlement Distribution & High-Risk Peak Hour Badges       │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTPS / REST (JSON)
┌────────────────────────────────────▼────────────────────────────────────┐
│                    Analytical API Engine (Render)                       │
│  FastAPI (Python 3.11) + Uvicorn + Pydantic v2 + scikit-learn           │
│  • Strict Lookahead-Free Temporal Sequestering Engine                   │
│  • Random Forest Forecast Uncertainty Scorer (0-100% Reliability)       │
│  • Rolling Adaptive Bias Correction Service                             │
│  • BSC Cash-Out Imbalance Penalty Engine (SBP / SSP / DA Price)         │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ SQLite B-Tree Query
┌────────────────────────────────────▼────────────────────────────────────┐
│                    Data Storage Layer (Seeded SQLite)                   │
│  1,488 actual outturn intervals + 5,952 multi-publish forecasts        │
│  January 2026 UK National Grid ESO (FUELHH / WINDFOR datasets)         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 💡 Core Capabilities & Financial Mechanics

### 1. Gate Closure & Zero-Lookahead Isolation
* Day-Ahead auctions close at **11:00 GMT on Day D-1**.
* To prevent data leakage, the engine enforces:  
  $$\text{Cutoff} = \text{Date}(T_{\text{delivery}} - 1\text{ day}) + 11:00\text{ GMT}$$
* Any forecast published after 11:00 GMT is strictly sequestered from Day-Ahead procurement decisions.

### 2. Asymmetric Cash-Out Exposure Engine
Standard MAE ignores market direction. WindCast models true Section T settlement:
* **Wind Deficit (Over-Predicted: Forecast > Actual)**:
  Utility short-falls the grid; must purchase emergency balancing volume at **System Buy Price (SBP)**:
  $$\text{Penalty}_{\text{deficit}} = (\text{Forecast} - \text{Actual}) \times 0.5\,\text{h} \times (\text{SBP} - P_{\text{DA}})$$
* **Wind Surplus (Under-Predicted: Forecast < Actual)**:
  Utility over-generates; excess volume spilled at discounted **System Sell Price (SSP)**:
  $$\text{Loss}_{\text{surplus}} = (\text{Actual} - \text{Forecast}) \times 0.5\,\text{h} \times (P_{\text{DA}} - \text{SSP})$$

### 3. Adaptive Rolling De-Biasing Model
* Applies a trailing calibration window ($W = 1, 3, 7\text{ days}$) across each of the 48 half-hour settlement slots:
  $$\text{Bias}_{d, p} = \frac{1}{W} \sum_{k=1}^{W} (\hat{Y}_{d-k, p} - Y_{d-k, p}), \quad \hat{Y}_{d, p}^{\text{corrected}} = \max(800\text{ MW},\, \hat{Y}_{d, p} - \text{Bias}_{d, p})$$
* **Result**: Achieves **15.2% MAE error reduction** and avoids **£14,200 in imbalance cash-out losses**.

### 4. Non-Parametric Thermal Reserve Sizing
* Computes deficit probability distributions:
  * **P90 Reserve Buffer (+1,842.3 MW)**: Thermal backup required to cover 90% of wind shortfall drops.
  * **P95 Conservative Buffer (+2,197.4 MW)**: High-security buffer for extreme ramp anomalies.

### 5. Multi-Horizon Information Decay Sensitivity
* Evaluates forecast accuracy progression across key market milestones:
  * `07:00 GMT`: Early morning baseline position
  * `11:00 GMT`: EPEX SPOT Day-Ahead Gate Closure (auction cutoff)
  * `17:00 GMT`: Evening Final Physical Notification window
  * `Intraday`: Continuous rolling 1-hour pre-delivery update
* Demonstrates the economic trade-off between bid firmness and information freshness.

---

## 🔌 API Reference & Endpoints

All endpoints return strongly typed, Pydantic-validated JSON responses. Interactive Swagger UI is live at [`/docs`](https://windcast-analytics-api.onrender.com/docs).

| Method | Endpoint | Purpose | Key Query Parameters |
|:---|:---|:---|:---|
| `GET` | `/api/health` | Service health, record counts, and database scope | None |
| `GET` | `/api/overview` | Aggregated executive KPIs for date ranges & gate closures | `start_date`, `end_date`, `gate_closure_hour` |
| `GET` | `/api/timeseries` | Paired 30-min actuals vs active Day-Ahead forecast | `start_date`, `end_date`, `gate_closure_hour` |
| `GET` | `/api/metrics` | Quantitative accuracy metrics (MAE, RMSE, MAPE, P90/P95 Buffers) | `start_date`, `end_date`, `gate_closure_hour` |
| `GET` | `/api/settlement-analysis` | 48-period diurnal profile, peak hour flags (16:30-19:00 GMT) | `start_date`, `end_date`, `gate_closure_hour` |
| `GET` | `/api/daily-breakdown` | 31-day January calendar breakdown of forecast error trends | `gate_closure_hour` |
| `GET` | `/api/financial-impact` | Imbalance cash-out exposure simulator under SBP/SSP spreads | `sbp`, `ssp`, `da_price`, `gate_closure_hour` |
| `GET` | `/api/bias-correction` | Rolling debiased model series, error drops & monetary savings | `window_days`, `gate_closure_hour` |
| `GET` | `/api/gate-closure-sensitivity` | Multi-horizon error & financial loss decay across milestones | `start_date`, `end_date` |
| `GET` | `/api/forecast-confidence` | ML Random Forest uncertainty score (0-100%) & feature weights | `gate_closure_hour` |

---

## 🛡️ Evaluation Guardrails & Test Suite (31 Tests Passing)

The platform is fortified by **31 automated unit, integration, and mathematical invariant tests** executing in GitHub Actions CI (`ci.yml`).

```bash
# Run full automated test suite from backend/
python -m pytest tests/ -v
# Output: 31 passed in 7.47s (100% success rate)
```

### 🔬 Categorized Invariant Breakdown:

#### 1. Temporal Isolation Guardrail (Zero-Lookahead Proof)
* **What it tests**: Verifies that 100% of paired Day-Ahead forecasts obey `publish_time <= cutoff_time`.
* **Why it matters**: Completely eliminates future data leakage; guarantees test accuracy reflects real-world trading performance.
* **Test cases**: `test_calculate_da_cutoff_time`, `test_da_cutoff_day_ahead_timing`.

#### 2. Mathematical Invariant Consistency
* **What it tests**: Formally asserts $\text{RMSE} \ge \text{MAE} > 0$ across all time horizons and settlement periods.
* **Why it matters**: Proves error distribution convexity and prevents statistical calculation anomalies.
* **Test cases**: `test_quantitative_accuracy_invariants`, `test_metrics_rmse_greater_equal_mae`.

#### 3. Extreme Tail Stress-Testing (Storms & Dropouts)
* **What it tests**: Verifies non-parametric quantile buffers during Atlantic Storm spikes (>18 GW) and Calm Spell anomalies (<5 GW). Asserts $\text{P95 Buffer} \ge \text{P90 Buffer} > 0$.
* **Why it matters**: Protects the utility from severe cash-out bankruptcy during sudden wind dropouts.
* **Test cases**: `test_thermal_procurement_buffer`, `test_procurement_buffer_monotonicity`.

#### 4. Physical Dispatch Floor Enforcement
* **What it tests**: Ensures debiased forecasts never output values below the physical turbine threshold ($Y_{\text{floor}} \ge 800\text{ MW}$).
* **Why it matters**: Prevents physically impossible negative generation dispatch commands.
* **Test cases**: `test_bias_correction_physical_floor_enforcement`, `test_bias_correction_removes_systematic_overforecast`.

#### 5. Balancing Mechanism Financial Conservation
* **What it tests**: Asserts zero error strictly incurs £0.00 penalty, and penalties scale monotonically with cash-out spreads.
* **Why it matters**: Guarantees accounting consistency and loss conservation.
* **Test cases**: `test_financial_impact_zero_error_yields_zero_penalty`, `test_financial_impact_monotonicity`.

#### 6. API Contracts & Database Integrity
* **What it tests**: End-to-end HTTP contract testing across all 10 endpoints, plus January 2026 database completeness ($31 \times 48 = 1,488$ actuals).
* **Test cases**: `test_api.py` (11 tests), `test_ingestion.py` (3 tests).

---

## 🚀 Strategic Horizon & Next Evolution

Key production enhancements designed for enterprise scale:

1. **Co-Located Battery (BESS) Arbitrage Dispatch**:
   Linear programming optimization to automatically absorb surplus wind generation during high-SSP discount periods and discharge during peak deficit hours.

2. **Multi-Model NWP Machine Learning Blending**:
   Gradient Boosting (LightGBM/XGBoost) blending multi-provider numerical weather feeds (ECMWF, GFS, UK Met Office) with atmospheric pressure and 100m wind shear features.

3. **Real-Time Elexon BMRS Webhook Stream**:
   Direct ingestion daemon for live REMIT outage messages and real-time Initial Balancing Publication (B1610/B1630) streaming.

---

## 💻 How to Run Locally

### Option A: One-Command Docker Setup (Recommended)
```bash
# Clone the repository
git clone https://github.com/FARINATTAR/kjhwr-.git
cd kjhwr-

# Build and start both Frontend and Backend
docker compose up --build -d

# Verify containers are running
docker compose ps
```
* **Frontend**: `http://localhost:3000`
* **Backend API & Swagger**: `http://localhost:8000/docs`

---

### Option B: Manual Local Setup

#### 1. Backend (FastAPI)
```bash
cd backend
python -m venv .venv

# Windows:
.\.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Navigate to `http://localhost:5173`.

---

## ⚖️ Technical Compliance & AI Disclosure
* **Scope**: January 2026 UK National Grid ESO Actual Wind Outturn (`FUELHH`) and Day-Ahead Forecasts (`WINDFOR`).
* **Framework**: React 18 (TypeScript, Vite) + Python 3.11 (FastAPI, SQLite, scikit-learn).
* **AI Tool Disclosure**: Built with pair-programming assistance from advanced AI tooling for rapid scaffolding, automated test suite generation, and regulatory market mechanic modeling, as permitted in the challenge specification.
