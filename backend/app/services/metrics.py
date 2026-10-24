"""
Statistical accuracy and error evaluation engine for wind generation forecasts.
Calculates MAE, RMSE, MAPE, Bias (MBE), Ramp Rate errors, and Settlement Period profiles.
"""
import math
from typing import Dict, List
from collections import defaultdict

def calculate_overall_metrics(paired_series: List[Dict]) -> Dict:
    """
    Computes summary quantitative accuracy metrics across the selected time window.
    """
    if not paired_series:
        return {
            "sample_count": 0,
            "mae_mw": 0.0,
            "rmse_mw": 0.0,
            "mape_pct": 0.0,
            "mean_bias_mw": 0.0,
            "nmae_pct": 0.0,
            "mean_actual_mw": 0.0,
            "mean_forecast_mw": 0.0
        }
        
    n = len(paired_series)
    sum_abs_error = 0.0
    sum_sq_error = 0.0
    sum_bias = 0.0
    sum_actual = 0.0
    sum_forecast = 0.0
    sum_pct_error = 0.0
    mape_count = 0  # count of intervals where MAPE is calculable (actual > 0)
    
    max_overforecast = 0.0
    max_underforecast = 0.0
    
    for item in paired_series:
        actual = item["actualMW"]
        forecast = item["dayAheadForecastMW"]
        error = forecast - actual  # bias: + is over, - is under
        abs_err = abs(error)
        
        sum_abs_error += abs_err
        sum_sq_error += error ** 2
        sum_bias += error
        sum_actual += actual
        sum_forecast += forecast
        
        if error > max_overforecast:
            max_overforecast = error
        if -error > max_underforecast:
            max_underforecast = -error
            
        # MAPE: skip intervals where actual is zero to avoid division by zero
        if actual > 0:
            sum_pct_error += (abs_err / actual) * 100.0
            mape_count += 1
        
    mae = sum_abs_error / n
    rmse = math.sqrt(sum_sq_error / n)
    mean_bias = sum_bias / n
    mean_actual = sum_actual / n
    mean_forecast = sum_forecast / n
    mape = (sum_pct_error / mape_count) if mape_count > 0 else 0.0
    nmae = (mae / mean_actual * 100.0) if mean_actual > 0 else 0.0
    
    return {
        "sample_count": n,
        "mae_mw": round(mae, 1),
        "rmse_mw": round(rmse, 1),
        "mape_pct": round(mape, 1),
        "mean_bias_mw": round(mean_bias, 1),
        "nmae_pct": round(nmae, 1),
        "mean_actual_mw": round(mean_actual, 1),
        "mean_forecast_mw": round(mean_forecast, 1),
        "max_overforecast_mw": round(max_overforecast, 1),
        "max_underforecast_mw": round(max_underforecast, 1)
    }

def calculate_settlement_period_profile(paired_series: List[Dict]) -> List[Dict]:
    """
    Computes error profile across the 48 UK half-hourly settlement periods.
    Allows traders to observe whether forecast error is concentrated during
    peak consumption hours (SP 33-38: 16:30 - 19:00).
    """
    sp_groups = defaultdict(list)
    for item in paired_series:
        sp_groups[item["settlementPeriod"]].append(item)
        
    profile = []
    for sp in range(1, 49):
        items = sp_groups.get(sp, [])
        if not items:
            continue
            
        m = calculate_overall_metrics(items)
        
        # Calculate human-readable time block (e.g., SP 1 -> "00:00 - 00:30")
        start_hour = (sp - 1) // 2
        start_min = 30 if (sp % 2 == 0) else 0
        end_hour = sp // 2
        end_min = 0 if (sp % 2 == 0) else 30
        time_slot = f"{start_hour:02d}:{start_min:02d} - {end_hour:02d}:{end_min:02d}"
        
        # Highlight UK peak demand window: 16:00 to 19:30 GMT (SP 33 to SP 39)
        is_peak = 33 <= sp <= 39
        
        profile.append({
            "settlementPeriod": sp,
            "timeSlot": time_slot,
            "isPeakPeriod": is_peak,
            "sampleCount": len(items),
            "maeMW": m["mae_mw"],
            "rmseMW": m["rmse_mw"],
            "meanBiasMW": m["mean_bias_mw"],
            "avgActualMW": m["mean_actual_mw"],
            "avgForecastMW": m["mean_forecast_mw"]
        })
        
    profile.sort(key=lambda x: x["settlementPeriod"])
    return profile

def calculate_daily_breakdown(paired_series: List[Dict]) -> List[Dict]:
    """
    Computes daily performance metrics across January 2026 for calendar and trend views.
    """
    day_groups = defaultdict(list)
    for item in paired_series:
        day_groups[item["settlementDate"]].append(item)
        
    breakdown = []
    for date_str, items in sorted(day_groups.items()):
        m = calculate_overall_metrics(items)
        breakdown.append({
            "date": date_str,
            "day": int(date_str.split("-")[2]),
            "maeMW": m["mae_mw"],
            "rmseMW": m["rmse_mw"],
            "meanBiasMW": m["mean_bias_mw"],
            "avgActualMW": m["mean_actual_mw"],
            "avgForecastMW": m["mean_forecast_mw"]
        })
        
    return breakdown

def calculate_ramp_metrics(paired_series: List[Dict]) -> Dict:
    """
    Calculates ramp rate accuracy (how well forecast predicted 30-min changes in generation).
    Sudden ramp misses are the primary cause of frequency disturbances on the grid.
    """
    if len(paired_series) < 2:
        return {"ramp_mae_mw": 0.0, "max_actual_ramp_mw": 0.0, "max_forecast_ramp_mw": 0.0}
        
    ramp_errors = []
    actual_ramps = []
    forecast_ramps = []
    
    for i in range(1, len(paired_series)):
        prev = paired_series[i - 1]
        curr = paired_series[i]
        
        # Only compare if within the same day
        if prev["settlementDate"] == curr["settlementDate"]:
            actual_ramp = curr["actualMW"] - prev["actualMW"]
            forecast_ramp = curr["dayAheadForecastMW"] - prev["dayAheadForecastMW"]
            
            actual_ramps.append(abs(actual_ramp))
            forecast_ramps.append(abs(forecast_ramp))
            ramp_errors.append(abs(forecast_ramp - actual_ramp))
            
    if not ramp_errors:
        return {"ramp_mae_mw": 0.0, "max_actual_ramp_mw": 0.0, "max_forecast_ramp_mw": 0.0}
        
    return {
        "ramp_mae_mw": round(sum(ramp_errors) / len(ramp_errors), 1),
        "max_actual_ramp_mw": round(max(actual_ramps), 1) if actual_ramps else 0.0,
        "max_forecast_ramp_mw": round(max(forecast_ramps), 1) if forecast_ramps else 0.0
    }
