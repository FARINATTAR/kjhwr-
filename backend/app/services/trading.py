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

    Uses a single SQL query with window functions instead of N+1 per-row lookups.
    Rows where no forecast was available at gate closure are excluded (not imputed
    with the actual value, which would artificially reduce error).
    """
    with get_db() as conn:
        cursor = conn.cursor()

        # Build all cutoffs for the date range (one per delivery date)
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")

        # 1. Fetch all actuals in range
        cursor.execute("""
            SELECT start_time, settlement_date, settlement_period, generation_mw
            FROM actual_generation
            WHERE settlement_date >= ? AND settlement_date <= ?
            ORDER BY start_time ASC;
        """, (start_date, end_date))
        actual_rows = cursor.fetchall()

        if not actual_rows:
            return []

        # 2. Get the latest DA forecast for each start_time using a single query
        #    with window function (ROW_NUMBER partitioned by start_time, ordered by
        #    publish_time DESC). Only considers forecasts published at or before the
        #    gate closure cutoff for that delivery date.
        #
        #    We compute all cutoffs and batch the query.
        #    For simplicity and SQLite compatibility, we use a subquery approach.

        # Build a mapping of settlement_date -> cutoff_iso
        unique_dates = sorted(set(row["settlement_date"] for row in actual_rows))
        cutoff_map = {}
        for d in unique_dates:
            cutoff_map[d] = calculate_da_cutoff(d, gate_closure_hour, gate_closure_minute)

        # 3. For each unique settlement date, get all forecasts published before cutoff
        #    Then find the latest one per start_time
        #    We batch this into one query per settlement date (31 queries max, not 1488)
        da_forecast_lookup = {}  # start_time -> (publish_time, generation_mw)
        latest_forecast_lookup = {}  # start_time -> (publish_time, generation_mw)

        for s_date in unique_dates:
            cutoff_iso = cutoff_map[s_date]

            # DA forecast: latest forecast published at or before gate closure cutoff
            cursor.execute("""
                SELECT start_time, publish_time, generation_mw
                FROM (
                    SELECT start_time, publish_time, generation_mw,
                           ROW_NUMBER() OVER (PARTITION BY start_time ORDER BY publish_time DESC) as rn
                    FROM forecast_generation
                    WHERE settlement_date = ? AND publish_time <= ?
                )
                WHERE rn = 1;
            """, (s_date, cutoff_iso))

            for row in cursor.fetchall():
                da_forecast_lookup[row["start_time"]] = (row["publish_time"], row["generation_mw"])

            # Latest forecast (any forecast published before the actual delivery time)
            cursor.execute("""
                SELECT start_time, publish_time, generation_mw
                FROM (
                    SELECT start_time, publish_time, generation_mw,
                           ROW_NUMBER() OVER (PARTITION BY start_time ORDER BY publish_time DESC) as rn
                    FROM forecast_generation
                    WHERE settlement_date = ? AND publish_time < (
                        SELECT MIN(a.start_time) FROM actual_generation a WHERE a.settlement_date = ?
                    )
                )
                WHERE rn = 1;
            """, (s_date, s_date))

            for row in cursor.fetchall():
                latest_forecast_lookup[row["start_time"]] = (row["publish_time"], row["generation_mw"])

        # 4. Pair actuals with forecasts
        paired_data = []
        missing_forecast_count = 0

        for row in actual_rows:
            st_time = row["start_time"]
            s_date = row["settlement_date"]
            s_period = row["settlement_period"]
            actual_mw = row["generation_mw"]

            cutoff_iso = cutoff_map[s_date]
            da_info = da_forecast_lookup.get(st_time)

            if da_info is None:
                # No forecast available at gate closure for this slot - skip it
                # (Do NOT impute with actual_mw as that would fake zero error)
                missing_forecast_count += 1
                continue

            da_publish, da_mw = da_info

            # Latest forecast (intraday benchmark)
            latest_info = latest_forecast_lookup.get(st_time)
            if latest_info:
                latest_publish, latest_mw = latest_info
            else:
                latest_publish = da_publish
                latest_mw = da_mw

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

        if missing_forecast_count > 0:
            import logging
            logging.getLogger(__name__).info(
                f"Paired {len(paired_data)} intervals, skipped {missing_forecast_count} with no DA forecast"
            )

        return paired_data


def compute_thermal_procurement_buffer(paired_series: List[Dict]) -> Dict:
    """
    Computes recommended thermal procurement safety margin (P90 and P95 buffer).
    When wind is over-forecasted (errorMW > 0), the utility experiences a wind deficit
    and must quickly procure emergency balancing power at high cash-out prices.
    The P90/P95 buffer indicates the MW capacity required to cover 90% or 95% of deficits.

    P90/P95 is computed over ALL intervals (including zero-error ones),
    not just the positive-error subset, to give a true population percentile.
    """
    if not paired_series:
        return {"p90_buffer_mw": 0.0, "p95_buffer_mw": 0.0, "max_deficit_mw": 0.0}

    # Use all error values for percentile calculation (including negatives and zeros)
    all_errors = sorted([item["errorMW"] for item in paired_series])
    n = len(all_errors)

    # P90 and P95 of the full error distribution
    idx_p90 = min(int(0.90 * n), n - 1)
    idx_p95 = min(int(0.95 * n), n - 1)

    p90_val = round(max(0, all_errors[idx_p90]), 1)
    p95_val = round(max(0, all_errors[idx_p95]), 1)

    # Deficit-specific stats
    deficits = [e for e in all_errors if e > 0]
    max_deficit = round(max(deficits), 1) if deficits else 0.0

    return {
        "p90_buffer_mw": p90_val,
        "p95_buffer_mw": p95_val,
        "max_deficit_mw": max_deficit,
        "deficit_probability_pct": round((len(deficits) / n) * 100, 1),
        "total_intervals": n,
        "deficit_intervals": len(deficits),
        "paired_count": n,
        "missing_forecast_count": 0  # tracked in get_day_ahead_paired_series
    }
