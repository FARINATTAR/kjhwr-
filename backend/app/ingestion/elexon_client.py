"""
Elexon BMRS API Client for streaming datasets.
Handles FUELHH (Actual Half-Hourly Outturn) and WINDFOR (Wind Generation Forecast).
"""
import logging
from typing import Any, Dict, List, Optional
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

class ElexonClient:
    def __init__(self, timeout: float = 20.0):
        self.timeout = timeout
        self.headers = {
            "User-Agent": "Energy-Analytics/1.0",
            "Accept": "application/json"
        }

    def fetch_fuelhh_stream(
        self,
        settlement_date_from: str,
        settlement_date_to: str,
        fuel_type: str = "WIND"
    ) -> List[Dict[str, Any]]:
        """
        Stream actual outturn by fuel type from Elexon BMRS FUELHH.
        Filters specifically for the requested fuelType (default: WIND).
        """
        params = {
            "settlementDateFrom": settlement_date_from,
            "settlementDateTo": settlement_date_to
        }
        
        try:
            with httpx.Client(timeout=self.timeout, headers=self.headers) as client:
                response = client.get(settings.elexon_fuelhh_endpoint, params=params)
                response.raise_for_status()
                records = response.json()
                
                # Filter strictly for target fuel type (e.g. WIND)
                wind_records = [
                    r for r in records
                    if r.get("fuelType", "").upper() == fuel_type.upper()
                ]
                logger.info(f"Fetched {len(wind_records)} {fuel_type} records from FUELHH ({settlement_date_from} to {settlement_date_to})")
                return wind_records
        except Exception as e:
            logger.warning(f"Failed to fetch live FUELHH data from Elexon API: {e}")
            return []

    def fetch_windfor_stream(
        self,
        publish_from: Optional[str] = None,
        publish_to: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Stream wind generation forecasts from Elexon BMRS WINDFOR.
        """
        params: Dict[str, str] = {}
        if publish_from:
            params["publishDateTimeFrom"] = publish_from
        if publish_to:
            params["publishDateTimeTo"] = publish_to
            
        try:
            with httpx.Client(timeout=self.timeout, headers=self.headers) as client:
                response = client.get(settings.elexon_windfor_endpoint, params=params)
                response.raise_for_status()
                records = response.json()
                logger.info(f"Fetched {len(records)} forecast records from WINDFOR")
                return records
        except Exception as e:
            logger.warning(f"Failed to fetch live WINDFOR data from Elexon API: {e}")
            return []
