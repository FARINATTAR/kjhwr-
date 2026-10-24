"""
Elexon BMRS API Client for streaming datasets.
Handles FUELHH (Actual Half-Hourly Outturn) and WINDFOR (Wind Generation Forecast).

FUELHH returns records with: dataset, publishTime, startTime, settlementDate,
settlementPeriod, fuelType, generation.

WINDFOR returns records with: dataset, publishTime, startTime, generation.
Note: WINDFOR does NOT include settlementDate or settlementPeriod fields,
and startTime is hourly (not half-hourly). The pipeline layer handles
the hourly-to-half-hourly mapping.
"""
import logging
import time
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

# Chunk size for date-range requests to avoid timeout on large queries
CHUNK_DAYS = 7
MAX_RETRIES = 3
RETRY_DELAY_SECONDS = 2


class ElexonClient:
    def __init__(self, timeout: float = 60.0):
        self.timeout = timeout
        self.headers = {
            "User-Agent": "Energy-Analytics/1.0",
            "Accept": "application/json"
        }

    def _request_with_retry(self, url: str, params: Dict[str, str]) -> List[Dict[str, Any]]:
        """Makes a GET request with retry logic for transient failures."""
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                with httpx.Client(timeout=self.timeout, headers=self.headers) as client:
                    response = client.get(url, params=params)
                    response.raise_for_status()
                    return response.json()
            except httpx.TimeoutException:
                logger.warning(f"Timeout on attempt {attempt}/{MAX_RETRIES} for {url}")
                if attempt < MAX_RETRIES:
                    time.sleep(RETRY_DELAY_SECONDS * attempt)
            except httpx.HTTPStatusError as e:
                logger.warning(f"HTTP {e.response.status_code} on attempt {attempt}/{MAX_RETRIES} for {url}")
                if attempt < MAX_RETRIES:
                    time.sleep(RETRY_DELAY_SECONDS * attempt)
            except Exception as e:
                logger.warning(f"Request failed on attempt {attempt}/{MAX_RETRIES}: {e}")
                if attempt < MAX_RETRIES:
                    time.sleep(RETRY_DELAY_SECONDS * attempt)

        logger.error(f"All {MAX_RETRIES} attempts failed for {url}")
        return []

    def fetch_fuelhh_stream(
        self,
        settlement_date_from: str,
        settlement_date_to: str,
        fuel_type: str = "WIND"
    ) -> List[Dict[str, Any]]:
        """
        Stream actual outturn by fuel type from Elexon BMRS FUELHH.
        Fetches in 7-day chunks to avoid API timeouts on large ranges.
        Filters specifically for the requested fuelType (default: WIND).
        """
        start = datetime.strptime(settlement_date_from, "%Y-%m-%d")
        end = datetime.strptime(settlement_date_to, "%Y-%m-%d")
        all_records: List[Dict[str, Any]] = []

        chunk_start = start
        while chunk_start <= end:
            chunk_end = min(chunk_start + timedelta(days=CHUNK_DAYS - 1), end)
            params = {
                "settlementDateFrom": chunk_start.strftime("%Y-%m-%d"),
                "settlementDateTo": chunk_end.strftime("%Y-%m-%d")
            }

            records = self._request_with_retry(settings.elexon_fuelhh_endpoint, params)

            # Filter strictly for target fuel type (e.g. WIND)
            wind_records = [
                r for r in records
                if r.get("fuelType", "").upper() == fuel_type.upper()
            ]
            all_records.extend(wind_records)
            logger.info(
                f"FUELHH chunk {chunk_start.strftime('%Y-%m-%d')} to {chunk_end.strftime('%Y-%m-%d')}: "
                f"{len(wind_records)} {fuel_type} records"
            )

            chunk_start = chunk_end + timedelta(days=1)

        logger.info(f"FUELHH total: {len(all_records)} {fuel_type} records for {settlement_date_from} to {settlement_date_to}")
        return all_records

    def fetch_windfor_stream(
        self,
        publish_from: Optional[str] = None,
        publish_to: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Stream wind generation forecasts from Elexon BMRS WINDFOR.
        Fetches in 7-day chunks by publish date to avoid API timeouts.

        WINDFOR records contain: publishTime, startTime, generation
        (no settlementDate or settlementPeriod - those are derived in the pipeline).
        """
        if not publish_from or not publish_to:
            logger.warning("WINDFOR fetch requires both publish_from and publish_to")
            return []

        # Parse publish dates (handle both date-only and datetime formats)
        start = datetime.fromisoformat(publish_from.replace("Z", "+00:00")).replace(tzinfo=None)
        end = datetime.fromisoformat(publish_to.replace("Z", "+00:00")).replace(tzinfo=None)

        all_records: List[Dict[str, Any]] = []

        chunk_start = start
        while chunk_start < end:
            chunk_end = min(chunk_start + timedelta(days=CHUNK_DAYS), end)
            params = {
                "publishDateTimeFrom": chunk_start.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "publishDateTimeTo": chunk_end.strftime("%Y-%m-%dT%H:%M:%SZ")
            }

            records = self._request_with_retry(settings.elexon_windfor_endpoint, params)
            all_records.extend(records)
            logger.info(
                f"WINDFOR chunk {chunk_start.strftime('%Y-%m-%d')} to {chunk_end.strftime('%Y-%m-%d')}: "
                f"{len(records)} forecast records"
            )

            chunk_start = chunk_end

        logger.info(f"WINDFOR total: {len(all_records)} forecast records")
        return all_records
