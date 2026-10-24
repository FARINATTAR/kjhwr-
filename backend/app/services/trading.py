"""
Trading and Day-Ahead decision engine.
Handles market gate-closure cutoff logic and calculates thermal procurement buffers.
"""
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from app.database import get_db

def calculate_da_cutoff(delivery_date_str: str, gate_closure_hour: int = 11, gate_closure_minute: int = 0) -> str:
    """
    Given a delivery date (YYYY-MM-DD), calculates the Day-Ahead decision cutoff timestamp.
    In the UK power market, the day-ahead auction clears on Day D-1 (e.g., at 11:00 GMT).
    Any forecast published after this timestamp was not available to the day-ahead trader.
    """
    delivery_date = datetime.strptime(delivery_date_str, "%Y-%m-%d")
    d_minus_1 = delivery_date - timedelta(days=1)
    cutoff_dt = d_minus_1.replace(hour=gate_closure_hour, minute=gate_closure_minute, second=0)
    return cutoff_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

def get_day_ahead_paired_series(
    start_date: str = "2026-01-01",
    end_date: str = "2026-01-31",
    gate_closure_hour: int = 11,
    gate_closure_minute: int = 0
) -> List[Dict]:
    """
    Retrieves actual wind outturn paired with the active Day-Ahead forecast
    available at the decision gate closure time (D-1 at gate_closure_hour:minute).
    Also includes the latest forecast published before delivery for comparison.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Fetch all actuals in range
        cursor.execute("""
            SELECT start_time, settlement_date, settlement_period, generation_mw
            FROM actual_generation
            WHERE settlement_date >= ? AND settlement_date <= ?
            ORDER BY start_time ASC;
        """, (start_date, end_date))
        actual_rows = cursor.fetchall()
        
        paired_data = []
        
        for row in actual_rows:
            st_time = row["start_time"]
            s_date = row["settlement_date"]
            s_period = row["settlement_period"]
            actual_mw = row["generation_mw"]
            
            # Decision cutoff for this delivery interval: D-1 at gate closure time
            cutoff_iso = calculate_da_cutoff(s_date, gate_closure_hour, gate_closure_minute)
            
            # Latest forecast published at or before the DA gate closure cutoff
            cursor.execute("""
                SELECT publish_time, generation_mw
                FROM forecast_generation
                WHERE start_time = ? AND publish_time <= ?
                ORDER BY publish_time DESC
                LIMIT 1;
            """, (st_time, cutoff_iso))
            da_forecast_row = cursor.fetchone()
            
            # Latest forecast published before delivery (Intraday benchmark)
            cursor.execute("""
                SELECT publish_time, generation_mw
                FROM forecast_generation
                WHERE start_time = ? AND publish_time < ?
                ORDER BY publish_time DESC
                LIMIT 1;
            """, (st_time, st_time))
            latest_forecast_row = cursor.fetchone()
            
            da_mw = da_forecast_row["generation_mw"] if da_forecast_row else actual_mw
            da_publish = da_forecast_row["publish_time"] if da_forecast_row else cutoff_iso
            
            latest_mw = latest_forecast_row["generation_mw"] if latest_forecast_row else da_mw
            latest_publish = latest_forecast_row["publish_time"] if latest_forecast_row else da_publish
            
            error_mw = round(da_mw - actual_mw, 1)  # positive = over-forecast, negative = under-forecast
            abs_error_mw = round(abs(error_mw), 1)
            
            paired_data.append({
                "startTime": st_time,
                "settlementDate": s_date,
                "settlementPeriod": s_period,
                "actualMW": round(actual_mw, 1),
                "dayAheadForecastMW": round(da_mw, 1),
                "dayAheadPublishTime": da_publish,
                "latestForecastMW": round(latest_mw, 1),
                "latestPublishTime": latest_publish,
                "errorMW": error_mw,
                "absErrorMW": abs_error_mw,
                "isOverforecast": error_mw > 0
            })
            
        return paired_data

def compute_thermal_procurement_buffer(paired_series: List[Dict]) -> Dict:
    """
    Computes recommended thermal procurement safety margin (P90 and P95 buffer).
    When wind is over-forecasted (errorMW > 0), the utility experiences a wind deficit
    and must quickly procure emergency balancing power at high cash-out prices.
    The P90/P95 buffer indicates the MW capacity required to cover 90% or 95% of deficits.
    """
    if not paired_series:
        return {"p90_buffer_mw": 0.0, "p95_buffer_mw": 0.0, "max_deficit_mw": 0.0}
        
    # Deficit occurs when Forecast > Actual (positive errorMW)
    deficits = [item["errorMW"] for item in paired_series if item["errorMW"] > 0]
    
    if not deficits:
        return {"p90_buffer_mw": 0.0, "p95_buffer_mw": 0.0, "max_deficit_mw": 0.0}
        
    deficits.sort()
    n = len(deficits)
    
    idx_p90 = min(int(0.90 * n), n - 1)
    idx_p95 = min(int(0.95 * n), n - 1)
    
    p90_val = round(deficits[idx_p90], 1)
    p95_val = round(deficits[idx_p95], 1)
    max_deficit = round(max(deficits), 1)
    
    return {
        "p90_buffer_mw": p90_val,
        "p95_buffer_mw": p95_val,
        "max_deficit_mw": max_deficit,
        "deficit_probability_pct": round((len(deficits) / len(paired_series)) * 100, 1),
        "total_intervals": len(paired_series),
        "deficit_intervals": len(deficits)
    }
