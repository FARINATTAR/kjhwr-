"""
High-fidelity seed data generator for January 2026 UK Wind Generation.
Generates realistic outturn and multi-horizon forecasts matching UK National Grid
wind operational characteristics (28GW fleet, winter storm cycles, diurnal patterns,
and NWP forecast uncertainty distributions).
"""
import math
import random
from datetime import datetime, timedelta
from typing import Dict, List, Tuple

def generate_january_2026_data() -> Tuple[List[Dict], List[Dict]]:
    """
    Generates actual outturns and multi-run forecasts for January 1 - 31, 2026.
    Returns:
        (actuals, forecasts)
    """
    # Deterministic seed for repeatable test outcomes
    rng = random.Random(42)
    
    start_date = datetime(2026, 1, 1, 0, 0, 0)
    end_date = datetime(2026, 1, 31, 23, 30, 0)
    
    # Base synoptic weather system parameters across 31 days (Atlantic depressions)
    # Cyclonic storm periods around Jan 4-6, Jan 14-17, Jan 23-26; Anti-cyclonic calm Jan 9-11
    actuals: List[Dict] = []
    forecasts: List[Dict] = []
    
    current_time = start_date
    delta_30m = timedelta(minutes=30)
    
    while current_time <= end_date:
        day_of_month = current_time.day
        hour_of_day = current_time.hour + (current_time.minute / 60.0)
        settlement_period = int(current_time.hour * 2 + (current_time.minute // 30) + 1)
        settlement_date_str = current_time.strftime("%Y-%m-%d")
        start_time_iso = current_time.strftime("%Y-%m-%dT%H:%M:%SZ")
        
        # 1. Weather Regime Simulation (MW)
        # Macro weather wave (storm fronts)
        synoptic_wave = math.sin((day_of_month / 31.0) * 4 * math.pi) * 5500
        # Medium wave (weather transitions)
        meso_wave = math.cos((day_of_month / 7.0) * 2 * math.pi) * 3000
        # Diurnal thermal wave
        diurnal_wave = math.sin(((hour_of_day - 6) / 24.0) * 2 * math.pi) * 1200
        # High frequency turbulence
        noise = rng.gauss(0, 350)
        
        base_capacity = 13500  # Baseline average UK wind outturn ~13.5 GW
        actual_mw = base_capacity + synoptic_wave + meso_wave + diurnal_wave + noise
        
        # Physical constraints: min 1,200 MW, max 26,500 MW
        actual_mw = max(1200.0, min(26500.0, round(actual_mw, 1)))
        
        actuals.append({
            "startTime": start_time_iso,
            "settlementDate": settlement_date_str,
            "settlementPeriod": settlement_period,
            "fuelType": "WIND",
            "generation": actual_mw
        })
        
        # 2. Multi-Horizon Forecast Generation (Simulating NWP Model Runs)
        # Forecast runs published at:
        # - Day D-1 at 07:00 (Early morning DA forecast)
        # - Day D-1 at 11:00 (Official Day-Ahead Gate Closure forecast)
        # - Day D-1 at 16:30 (Afternoon DA update)
        # - Day D-0 at 05:00 (Intraday update)
        
        delivery_day = current_time.replace(hour=0, minute=0, second=0)
        day_minus_1 = delivery_day - timedelta(days=1)
        
        forecast_runs = [
            # (name, publish_datetime, error_std_dev, bias_mw)
            ("D-1 Early (07:00)", day_minus_1.replace(hour=7, minute=0), 1450, 150),
            ("D-1 Gate Closure (11:00)", day_minus_1.replace(hour=11, minute=0), 1100, 80),
            ("D-1 Post-Auction (16:30)", day_minus_1.replace(hour=16, minute=30), 850, 40),
            ("D-0 Intraday (05:00)", delivery_day.replace(hour=5, minute=0), 550, 10),
        ]
        
        for name, pub_dt, error_sigma, bias in forecast_runs:
            pub_time_iso = pub_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
            # Systematic slight overforecast in calm anticyclonic and ramp timing errors
            ramp_factor = math.sin((hour_of_day / 24.0) * 2 * math.pi) * 200
            forecast_error = rng.gauss(bias, error_sigma) + ramp_factor
            forecast_mw = actual_mw + forecast_error
            forecast_mw = max(800.0, min(27000.0, round(forecast_mw, 1)))
            
            forecasts.append({
                "startTime": start_time_iso,
                "settlementDate": settlement_date_str,
                "settlementPeriod": settlement_period,
                "publishTime": pub_time_iso,
                "generation": forecast_mw
            })
            
        current_time += delta_30m
        
    return actuals, forecasts
