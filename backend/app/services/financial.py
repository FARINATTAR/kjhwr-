"""
Financial impact estimator converting forecast errors into GBP cost exposure.
Uses representative UK System Buy Price (SBP) and System Sell Price (SSP)
to quantify the monetary cost of wind forecast inaccuracy on the utility's P&L.
"""
from typing import Dict, List

# Typical UK balancing mechanism price ranges (£/MWh) for January winter period
# SBP applies when the utility is short (over-forecast wind = deficit)
# SSP applies when the utility is long (under-forecast wind = surplus spill)
DEFAULT_SBP_GBP_PER_MWH = 120.0  # System Buy Price (penalty for being short)
DEFAULT_SSP_GBP_PER_MWH = 45.0   # System Sell Price (received when long, usually much lower)
DEFAULT_DA_PRICE_GBP_PER_MWH = 75.0  # Approximate Day-Ahead clearing price


def calculate_financial_impact(
    paired_series: List[Dict],
    sbp: float = DEFAULT_SBP_GBP_PER_MWH,
    ssp: float = DEFAULT_SSP_GBP_PER_MWH,
    da_price: float = DEFAULT_DA_PRICE_GBP_PER_MWH
) -> Dict:
    """
    Estimates the financial exposure created by wind forecast errors.

    When the utility OVER-forecasts wind (Forecast > Actual):
        - They under-procure thermal power in the Day-Ahead auction.
        - At delivery, they must buy emergency balancing power at the System Buy Price (SBP),
          which is typically much higher than the DA price.
        - Cost penalty per interval = (Forecast - Actual) * 0.5h * (SBP - DA_Price)

    When the utility UNDER-forecasts wind (Forecast < Actual):
        - They over-procure thermal power.
        - Excess power is sold back at the System Sell Price (SSP),
          which is typically much lower than the DA price.
        - Cost penalty per interval = (Actual - Forecast) * 0.5h * (DA_Price - SSP)
    """
    if not paired_series:
        return _empty_impact()

    total_deficit_cost = 0.0
    total_surplus_cost = 0.0
    total_deficit_mwh = 0.0
    total_surplus_mwh = 0.0
    deficit_intervals = 0
    surplus_intervals = 0
    worst_deficit_cost = 0.0
    worst_surplus_cost = 0.0

    for item in paired_series:
        error_mw = item["errorMW"]  # Forecast - Actual
        energy_mwh = abs(error_mw) * 0.5  # Half-hour interval → MWh

        if error_mw > 0:
            # Over-forecast: utility is short, buys at SBP
            cost = energy_mwh * (sbp - da_price)
            total_deficit_cost += cost
            total_deficit_mwh += energy_mwh
            deficit_intervals += 1
            worst_deficit_cost = max(worst_deficit_cost, cost)
        elif error_mw < 0:
            # Under-forecast: utility is long, sells back at SSP
            cost = energy_mwh * (da_price - ssp)
            total_surplus_cost += cost
            total_surplus_mwh += energy_mwh
            surplus_intervals += 1
            worst_surplus_cost = max(worst_surplus_cost, cost)

    total_cost = total_deficit_cost + total_surplus_cost
    n = len(paired_series)

    return {
        "total_imbalance_cost_gbp": round(total_cost, 0),
        "deficit_cost_gbp": round(total_deficit_cost, 0),
        "surplus_cost_gbp": round(total_surplus_cost, 0),
        "deficit_energy_mwh": round(total_deficit_mwh, 1),
        "surplus_energy_mwh": round(total_surplus_mwh, 1),
        "avg_cost_per_interval_gbp": round(total_cost / n, 1) if n else 0.0,
        "worst_single_deficit_gbp": round(worst_deficit_cost, 0),
        "worst_single_surplus_gbp": round(worst_surplus_cost, 0),
        "deficit_intervals": deficit_intervals,
        "surplus_intervals": surplus_intervals,
        "total_intervals": n,
        "assumptions": {
            "system_buy_price_gbp_mwh": sbp,
            "system_sell_price_gbp_mwh": ssp,
            "day_ahead_price_gbp_mwh": da_price
        }
    }


def _empty_impact() -> Dict:
    return {
        "total_imbalance_cost_gbp": 0.0,
        "deficit_cost_gbp": 0.0,
        "surplus_cost_gbp": 0.0,
        "deficit_energy_mwh": 0.0,
        "surplus_energy_mwh": 0.0,
        "avg_cost_per_interval_gbp": 0.0,
        "worst_single_deficit_gbp": 0.0,
        "worst_single_surplus_gbp": 0.0,
        "deficit_intervals": 0,
        "surplus_intervals": 0,
        "total_intervals": 0,
        "assumptions": {}
    }
