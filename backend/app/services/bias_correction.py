"""
Statistical bias correction engine applying rolling mean bias removal
to improve Day-Ahead wind forecast accuracy.
Demonstrates the value proposition of an adaptive analytical layer
on top of raw Elexon NWP forecasts.
"""
from typing import Dict, List


def apply_bias_correction(paired_series: List[Dict], window_days: int = 7) -> List[Dict]:
    """
    Applies a trailing-window mean bias correction to the Day-Ahead forecast.

    For each settlement period, calculates the average bias (Forecast - Actual)
    over the preceding `window_days`, then subtracts that bias from the
    current day's forecast to produce a corrected value.

    This is a simple, interpretable statistical correction that a real
    energy trading desk would use as a first-order improvement before
    deploying more complex ML models.
    """
    if not paired_series:
        return []

    # Group by settlement date for daily rolling window calculation
    by_date: Dict[str, List[Dict]] = {}
    for item in paired_series:
        dt = item["settlementDate"]
        by_date.setdefault(dt, []).append(item)

    sorted_dates = sorted(by_date.keys())
    corrected_series: List[Dict] = []

    for i, date in enumerate(sorted_dates):
        # Gather trailing window of previous days' errors for bias estimation
        window_start = max(0, i - window_days)
        trailing_items = []
        for j in range(window_start, i):
            trailing_items.extend(by_date[sorted_dates[j]])

        # Calculate trailing mean bias per settlement period (same SP only, trailing days only)
        # Fall back to overall trailing mean if a specific SP has no trailing items
        if trailing_items:
            overall_bias = sum(it["errorMW"] for it in trailing_items) / len(trailing_items)
            sp_errors: Dict[int, List[float]] = {}
            for it in trailing_items:
                sp_errors.setdefault(it["settlementPeriod"], []).append(it["errorMW"])
            sp_bias = {
                sp: (sum(errs) / len(errs)) for sp, errs in sp_errors.items()
            }
        else:
            # First day(s): no trailing data available, use zero correction
            overall_bias = 0.0
            sp_bias = {}

        # Apply correction to current day's intervals
        for item in by_date[date]:
            sp = item["settlementPeriod"]
            applied_bias = sp_bias.get(sp, overall_bias)
            corrected_mw = round(item["dayAheadForecastMW"] - applied_bias, 1)
            corrected_mw = max(800.0, corrected_mw)  # Physical floor

            corrected_error = round(corrected_mw - item["actualMW"], 1)

            corrected_series.append({
                **item,
                "correctedForecastMW": corrected_mw,
                "correctedErrorMW": corrected_error,
                "absCorrectedErrorMW": round(abs(corrected_error), 1),
                "biasAppliedMW": round(applied_bias, 1)
            })

    return corrected_series


def compare_raw_vs_corrected(paired_series: List[Dict], window_days: int = 7) -> Dict:
    """
    Produces a side-by-side comparison of raw Elexon forecast vs debiased
    forecast, computing improvement percentages.
    """
    corrected = apply_bias_correction(paired_series, window_days)

    if not corrected:
        return {
            "raw_mae_mw": 0.0,
            "corrected_mae_mw": 0.0,
            "mae_improvement_pct": 0.0,
            "raw_mean_bias_mw": 0.0,
            "corrected_mean_bias_mw": 0.0,
            "bias_reduction_pct": 0.0,
            "correction_window_days": window_days,
            "sample_count": 0,
            "raw_mae": 0.0,
            "corrected_mae": 0.0,
            "improvement_pct": 0.0,
        }

    n = len(corrected)
    raw_mae = sum(item["absErrorMW"] for item in corrected) / n
    corrected_mae = sum(item["absCorrectedErrorMW"] for item in corrected) / n

    improvement = ((raw_mae - corrected_mae) / raw_mae * 100) if raw_mae > 0 else 0.0

    raw_bias = sum(item["errorMW"] for item in corrected) / n
    corrected_bias = sum(item["correctedErrorMW"] for item in corrected) / n

    return {
        "raw_mae_mw": round(raw_mae, 1),
        "corrected_mae_mw": round(corrected_mae, 1),
        "mae_improvement_pct": round(improvement, 1),
        "raw_mean_bias_mw": round(raw_bias, 1),
        "corrected_mean_bias_mw": round(corrected_bias, 1),
        "bias_reduction_pct": round(
            ((abs(raw_bias) - abs(corrected_bias)) / abs(raw_bias) * 100) if abs(raw_bias) > 0 else 0.0, 1
        ),
        "correction_window_days": window_days,
        "sample_count": n
    }
