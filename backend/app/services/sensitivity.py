"""
Gate Closure Sensitivity Analysis.
Quantifies how forecast accuracy (MAE, RMSE, Bias, and Financial Risk)
evolves as decision gate closures move closer to physical delivery.

Key trading insight:
Demonstrates the economic and operational value of 'information freshness'.
Traders can quantify how much forecast risk drops if they delay hedging decisions
or participate in later auction windows (e.g. EPEX DA at 11:00 vs Intraday continuous).
"""
from typing import Dict, List
from app.services.trading import get_day_ahead_paired_series
from app.services.metrics import calculate_overall_metrics
from app.services.financial import calculate_financial_impact

KEY_GATE_CLOSURES = [
    {"label": "D-1 Early Morning (07:00 GMT)", "hour": 7, "minute": 0, "description": "Pre-auction preliminary view"},
    {"label": "D-1 Nord Pool Window (09:00 GMT)", "hour": 9, "minute": 0, "description": "Early day-ahead auction prep"},
    {"label": "D-1 EPEX Gate Closure (11:00 GMT)", "hour": 11, "minute": 0, "description": "Official UK Day-Ahead auction cutoff"},
    {"label": "D-1 Afternoon Refinement (14:00 GMT)", "hour": 14, "minute": 0, "description": "Post-auction secondary trading"},
    {"label": "D-1 Evening BM Submission (17:00 GMT)", "hour": 17, "minute": 0, "description": "National Grid notification window"},
    {"label": "D-1 Late Night Update (22:00 GMT)", "hour": 22, "minute": 0, "description": "Overnight adjustment"},
]


def evaluate_gate_closure_sensitivity(
    start_date: str = "2026-01-01",
    end_date: str = "2026-01-31"
) -> List[Dict]:
    """
    Evaluates MAE, RMSE, Mean Bias, and Imbalance Cost across various gate closure times
    for the specified date range. Also includes the Intraday benchmark.
    """
    results = []

    # 1. Evaluate standard D-1 gate closure hours
    for gc in KEY_GATE_CLOSURES:
        paired = get_day_ahead_paired_series(
            start_date=start_date,
            end_date=end_date,
            gate_closure_hour=gc["hour"],
            gate_closure_minute=gc["minute"]
        )
        metrics = calculate_overall_metrics(paired)
        financial = calculate_financial_impact(paired)

        results.append({
            "closureLabel": gc["label"],
            "closureHour": gc["hour"],
            "description": gc["description"],
            "maeMW": metrics["mae_mw"],
            "rmseMW": metrics["rmse_mw"],
            "meanBiasMW": metrics["mean_bias_mw"],
            "imbalanceCostGBP": financial["total_imbalance_cost_gbp"],
            "sampleCount": metrics["sample_count"]
        })

    # 2. Evaluate Intraday (latest forecast available just before delivery)
    sample_paired = get_day_ahead_paired_series(start_date=start_date, end_date=end_date, gate_closure_hour=11)
    if sample_paired:
        intraday_paired = [
            {
                **item,
                "dayAheadForecastMW": item["latestForecastMW"],
                "errorMW": round(item["latestForecastMW"] - item["actualMW"], 1),
                "absErrorMW": round(abs(item["latestForecastMW"] - item["actualMW"]), 1)
            }
            for item in sample_paired
        ]
        intraday_metrics = calculate_overall_metrics(intraday_paired)
        intraday_financial = calculate_financial_impact(intraday_paired)

        results.append({
            "closureLabel": "Intraday Rolling (1h Pre-delivery)",
            "closureHour": 24,  # Marker for intraday
            "description": "Continuous intraday market position close to delivery",
            "maeMW": intraday_metrics["mae_mw"],
            "rmseMW": intraday_metrics["rmse_mw"],
            "meanBiasMW": intraday_metrics["mean_bias_mw"],
            "imbalanceCostGBP": intraday_financial["total_imbalance_cost_gbp"],
            "sampleCount": intraday_metrics["sample_count"]
        })

    return results
