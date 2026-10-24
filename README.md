# REint AI — UK Wind Generation Day-Ahead Trading & Forecasting Analytics Platform

An institutional-grade Day-Ahead wind power forecasting evaluation and trading analytics platform designed for UK wholesale power desks and energy utilities. Built for the **REint AI Full-Stack SWE Challenge**.

---

## ⚡ The Energy Trading Challenge

In the UK power market (GB National Grid / Elexon BSC framework), wholesale power traders must submit generation schedules and hedge contracts prior to **Day-Ahead Gate Closure (11:00 GMT on Day D-1)** for delivery across the 48 half-hour settlement periods of Day D.

```
                    Day D-1                                              Day D (Delivery)
   ─────────────────────────────────────────────┼─────────────────────────────────────────────►
     07:00       09:00       11:00 (GATE CLOSURE)     00:00 (SP 1)            23:30 (SP 48)
     Early       Nord Pool   EPEX Auction Closes      Delivery Starts         Delivery Ends
     Forecast    Window      [FIRM TRADING POSITION]
```

### Why Naive Forecasting Evaluations Fail in Production:
1. **Lookahead Bias**: A common flaw in standard evaluations is pairing actual generation with the latest forecast published *after* gate closure. In reality, a trader at 11:00 GMT on D-1 **cannot** see forecasts published at 17:00 GMT or during intraday continuous trading.
2. **Abstract Metrics vs Real P&L**: Reporting MAE in Megawatts (MW) is insufficient for an energy trading desk. A 500 MW deficit during peak demand creates catastrophic imbalance cash-out penalties (System Buy Price), whereas a 500 MW surplus merely spills into the market at discounted rates (System Sell Price).
3. **Operational Procurement Buffers**: Traders do not trade on point forecasts alone; they require conservative safety margins (P90/P95 thermal procurement buffers) to avoid expensive emergency Balancing Mechanism dispatches.

---

## 🌟 Standout Features & Differentiators

This solution goes far beyond basic CRUD and chart plotting. It embodies real product thinking tailored directly to an energy desk:

### 1. 💷 £ Financial Impact & Imbalance Exposure Calculator
* **Concept**: Converts abstract MW errors into actual GBP (£) cash-out penalty exposure under Elexon BSC Section T rules.
* **Mechanism**: 
  - **Shortfall (Over-forecast)**: Utility is short $\to$ purchases emergency balancing power at System Buy Price (SBP, default £120/MWh). $\text{Penalty} = \Delta \text{MW} \times 0.5\text{h} \times (\text{SBP} - \text{DA\_Price})$.
  - **Surplus (Under-forecast)**: Utility is long $\to$ dumps surplus energy at System Sell Price (SSP, default £45/MWh).
* **Interactive Controls**: Real-time sliders for SBP, SSP, and Day-Ahead clearing price calculate total portfolio loss, interval averages, and worst single-period peak exposure.

### 2. 🧠 REint AI Statistical Bias-Correction Lab
* **Concept**: Demonstrates REint's analytical value proposition on top of raw Elexon NWP forecasts.
* **Mechanism**: Applies a trailing-window rolling mean debiasing algorithm (configurable 3, 7, 14 days) across all 48 settlement periods.
* **Results**: Measurably reduces MAE and eliminates systematic over-forecasting bias before placing bids in the EPEX auction.

### 3. ⏳ Gate Closure Sensitivity ("The Value of Time")
* **Concept**: Quantifies how forecast accuracy and financial exposure evolve as decisions move closer to physical delivery.
* **Hedge Horizons**: Evaluates MAE, RMSE, and Imbalance Cost across 07:00, 09:00, 11:00 (DA), 14:00, 17:00, 22:00, and Intraday rolling forecasts.
* **Trader Insight**: Quantifies the exact risk premium paid for locking positions Day-Ahead vs participating in intraday continuous markets.

### 4. 🛡️ Operational Thermal Procurement Buffer (P90 / P95)
* Non-parametric quantile analysis calculating the exact MW thermal backup capacity needed to ensure 90% or 95% protection against sudden wind drop-offs.

### 5. 🕒 48 Settlement Period Diurnal Analysis
* Breakdown across all 48 half-hour UK settlement periods, flagging evening peak ramp hours (SP 34–38: 16:30–19:00 GMT) where wind forecast inaccuracy poses the highest grid risk.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React 18 + Vite Frontend                 │
│  - Interactive Recharts TimeSeries & Settlement Heatmaps    │
│  - Financial Imbalance Calculator (P&L Simulation)          │
│  - Bias Correction Engine Lab                               │
│  - Gate Closure Sensitivity Curves                          │
│  - One-click CSV Data Export                                │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON API (Port 8000)
┌──────────────────────────────▼──────────────────────────────┐
│                    FastAPI Backend (Python)                 │
│  ├── /api/overview          (High-level executive metrics) │
│  ├── /api/timeseries        (Paired Day-Ahead time-series)  │
│  ├── /api/metrics           (MAE, RMSE, MAPE, Ramps, Buffers)│
│  ├── /api/settlement-analysis (48 SP diurnal profiles)      │
│  ├── /api/daily-breakdown   (January 2026 day-by-day stats) │
│  ├── /api/financial-impact  (£ GBP imbalance calculator)    │
│  ├── /api/bias-correction   (Rolling debiasing alpha engine)│
│  └── /api/gate-closure-sensitivity (Multi-gate comparisons) │
└──────────────────────────────┬──────────────────────────────┘
                               │ SQLite Engine (Indexed)
┌──────────────────────────────▼──────────────────────────────┐
│                     Database Layer (SQLite)                 │
│  - actual_generation    (1,488 records: Jan 1 - Jan 31 2026)│
│  - forecast_generation  (7,440 records: multi-run NWPs)     │
│  - Zero Lookahead Bias Enforcement Logic                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quickstart Guide

### Option 1: One-Command Docker Compose (Recommended)

Make sure Docker and Docker Compose are installed and running:

```bash
docker compose up --build
```

- **Frontend Application**: `http://localhost:3000`
- **Backend API Docs (Swagger)**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/api/health`

---

### Option 2: Local Development (Without Docker)

#### 1. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.\.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🧪 Automated Test Suite

The test suite validates data ingestion, database integrity, trading gate closure cutoffs, metric invariants (e.g. $\text{RMSE} \ge \text{MAE}$), financial calculators, and all REST endpoints.

Run pytest from the `backend/` directory:
```bash
cd backend
.\.venv\Scripts\python.exe -m pytest -v
```

### Test Coverage Highlights:
- `test_database_initialization`: Verifies schema creation and indexing.
- `test_january_2026_data_counts`: Guarantees exactly 1,488 half-hour settlement periods (31 days × 48).
- `test_calculate_da_cutoff_time`: Asserts zero lookahead bias at D-1 11:00 GMT cutoff.
- `test_quantitative_accuracy_invariants`: Asserts mathematical consistency across MAE, RMSE, MAPE, and NMAE.
- `test_thermal_procurement_buffer`: Verifies P90/P95 deficit quantile calculation.
- `test_financial_impact_endpoint`: Verifies GBP balancing mechanism penalty computation.
- `test_bias_correction_endpoint`: Verifies rolling debiasing engine outputs.
- `test_gate_closure_sensitivity_endpoint`: Verifies multi-gate decay curves.

---

## 📋 Comprehensive API Reference

| Endpoint | Method | Description |
|:---|:---:|:---|
| `/api/health` | `GET` | Service status, database record counts, and target scope |
| `/api/overview` | `GET` | Executive dashboard summary cards for selected date range |
| `/api/timeseries` | `GET` | Paired 30-min actuals vs Day-Ahead gate closure forecasts |
| `/api/metrics` | `GET` | Quantitative evaluation (MAE, RMSE, MAPE, Bias, Ramps, P90/P95 buffers) |
| `/api/settlement-analysis` | `GET` | Diurnal profile across all 48 UK settlement periods |
| `/api/daily-breakdown` | `GET` | Day-by-day January 2026 accuracy and volume calendar |
| `/api/financial-impact` | `GET` | Imbalance cash-out exposure calculator in GBP with custom SBP/SSP |
| `/api/bias-correction` | `GET` | REint rolling debiasing engine with raw vs corrected comparisons |
| `/api/gate-closure-sensitivity`| `GET` | Sensitivity curve across 07:00, 09:00, 11:00, 14:00, 17:00, Intraday |

---

## 🔮 Future Product Roadmap

1. **Physical Asset Dispatch & Battery Arbitrage Optimizer**:
   - Pair wind forecast uncertainty with co-located battery energy storage systems (BESS) to automatically absorb over-generation and discharge during deficit intervals.
2. **NWP Machine Learning Ensemble (GBM + LSTM)**:
   - Train gradient boosting models on historical atmospheric features (wind shear, barometric pressure gradients, temperature inversions) to generate proprietary synthetic wind power curves.
3. **Automated Live Elexon BMRS Webhooks**:
   - Real-time ingestion daemon listening for National Grid ESO BMRS REMIT notices and half-hourly outturn updates.

---

**Developed for REint AI Technical Evaluation — January 2026 UK Wind Outturn Scope.**
