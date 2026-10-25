"""
Data ingestion pipeline coordinating data fetching, validation, and storage.
Handles the key WINDFOR schema difference: Elexon WINDFOR provides hourly
forecasts (startTime on the hour), but the UK market uses half-hourly
settlement periods. Each hourly forecast is mapped to 2 settlement periods.

Supports both live Elexon BMRS ingestion and fallback seed data.
"""
import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Tuple
from app.database import get_db, init_db
from app.ingestion.elexon_client import ElexonClient
from app.ingestion.seed_data import generate_january_2026_data

logger = logging.getLogger(__name__)


def _normalize_iso_z(ts_str: str) -> str:
    """Normalizes an ISO timestamp string (+00:00 or Z) to standard UTC YYYY-MM-DDTHH:MM:SSZ format."""
    if not ts_str:
        return ts_str
    try:
        dt = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
        return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    except Exception:
        return ts_str


def _derive_settlement_from_start_time(start_time_iso: str) -> Tuple[str, int, int]:
    """
    Derives settlement_date and settlement_period(s) from a WINDFOR startTime.

    WINDFOR startTime is hourly (e.g. 2026-01-01T00:00:00Z).
    Each hour maps to 2 half-hourly settlement periods:
      - startTime 00:00 -> SP 1 (00:00-00:30) and SP 2 (00:30-01:00)
      - startTime 01:00 -> SP 3 (01:00-01:30) and SP 4 (01:30-02:00)
      - etc.

    January 2026 is fully in GMT (no DST), so Z timestamps are safe.

    Returns: (settlement_date, first_sp, second_sp)
    """
    dt = datetime.fromisoformat(start_time_iso.replace("Z", "+00:00")).replace(tzinfo=None)
    settlement_date = dt.strftime("%Y-%m-%d")
    hour = dt.hour
    minute = dt.minute

    # Base SP: hour * 2 + 1 for :00, hour * 2 + 2 for :30
    first_sp = hour * 2 + 1
    second_sp = first_sp + 1

    return settlement_date, first_sp, second_sp


def _expand_windfor_to_half_hourly(raw_records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Expands hourly WINDFOR records into half-hourly records with derived
    settlementDate and settlementPeriod fields.

    Each hourly forecast record becomes 2 records (one per half-hour).
    The same generation MW value is assigned to both half-hours within the hour.
    """
    expanded = []
    for record in raw_records:
        start_time = record.get("startTime", "")
        publish_time = _normalize_iso_z(record.get("publishTime", ""))
        generation = record.get("generation", 0)

        if not start_time:
            continue

        settlement_date, sp1, sp2 = _derive_settlement_from_start_time(start_time)

        # Only include records where startTime falls within January 2026
        if not settlement_date.startswith("2026-01-"):
            continue

        # First half-hour (e.g. 00:00-00:30)
        dt1 = datetime.fromisoformat(start_time.replace("Z", "+00:00")).replace(tzinfo=None)
        start_time_1 = dt1.strftime("%Y-%m-%dT%H:%M:%SZ")

        expanded.append({
            "startTime": start_time_1,
            "settlementDate": settlement_date,
            "settlementPeriod": sp1,
            "publishTime": publish_time,
            "generation": generation
        })

        # Second half-hour (e.g. 00:30-01:00)
        dt2 = dt1 + timedelta(minutes=30)
        start_time_2 = dt2.strftime("%Y-%m-%dT%H:%M:%SZ")
        # Second SP might roll into next day at 23:30->00:00
        # but for January, SP 48 is 23:30 and that's the last one
        if sp2 <= 48:
            expanded.append({
                "startTime": start_time_2,
                "settlementDate": settlement_date,
                "settlementPeriod": sp2,
                "publishTime": publish_time,
                "generation": generation
            })

    logger.info(f"Expanded {len(raw_records)} hourly WINDFOR records into {len(expanded)} half-hourly records")
    return expanded


class DataPipeline:
    def __init__(self):
        self.client = ElexonClient()
        self._data_source = "unknown"
        init_db()

    @property
    def data_source(self) -> str:
        return self._data_source

    def get_database_stats(self) -> Dict[str, Any]:
        """Returns row counts of actual and forecast tables, plus data source info."""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM actual_generation;")
            actuals_count = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM forecast_generation;")
            forecasts_count = cursor.fetchone()[0]

            # 1. Read source from metadata table if present
            try:
                cursor.execute("SELECT value FROM metadata WHERE key = 'data_source';")
                meta_row = cursor.fetchone()
                if meta_row:
                    self._data_source = meta_row[0]
            except Exception:
                pass

            # 2. If unknown but data exists, check seed signature (5952 rows = 4 seed runs)
            if self._data_source == "unknown" and actuals_count > 0:
                if forecasts_count == 5952:
                    self._data_source = "seed_dataset"
                else:
                    self._data_source = "live_elexon"

            return {
                "actuals_count": actuals_count,
                "forecasts_count": forecasts_count,
                "data_source": self._data_source
            }

    def seed_database_if_needed(self, force: bool = False) -> Dict[str, Any]:
        """
        Ensures the January 2026 dataset is present in SQLite.
        If tables are empty, contains seed data, or force is True, ingests live Elexon data.
        Attempts live Elexon API first, falls back to seed data only if API fails.
        """
        stats = self.get_database_stats()
        # If database is already populated with real Elexon data, do not overwrite unless forced
        if not force and stats["actuals_count"] > 0 and stats["forecasts_count"] > 0 and stats["data_source"] == "live_elexon":
            logger.info(f"Database already populated with real Elexon data: {stats}")
            return {
                "status": "already_populated",
                "source": self._data_source,
                **stats
            }

        logger.info("Populating January 2026 dataset from Elexon BMRS API...")

        # 1. Fetch actuals from FUELHH (real Elexon data)
        live_actuals = self.client.fetch_fuelhh_stream("2026-01-01", "2026-01-31", fuel_type="WIND")

        # 2. Fetch forecasts from WINDFOR (need D-1 forecasts for each day)
        # For Jan 1 delivery, we need forecasts published from Dec 31
        # For Jan 31 delivery, we need forecasts published up to Jan 31
        live_forecasts_raw = []
        if live_actuals:
            live_forecasts_raw = self.client.fetch_windfor_stream(
                publish_from="2025-12-31T00:00:00Z",
                publish_to="2026-01-31T23:59:59Z"
            )

        if live_actuals and live_forecasts_raw:
            self._data_source = "live_elexon"
            for act in live_actuals:
                act["startTime"] = _normalize_iso_z(act.get("startTime", ""))
                act["publishTime"] = _normalize_iso_z(act.get("publishTime", ""))
            actuals_to_insert = live_actuals

            # Expand hourly WINDFOR to half-hourly with derived settlement fields
            forecasts_to_insert = _expand_windfor_to_half_hourly(live_forecasts_raw)
            logger.info(f"Using real Elexon data: {len(actuals_to_insert)} actuals, {len(forecasts_to_insert)} forecasts")
        else:
            logger.warning(
                "Elexon API returned empty data or failed. "
                "Falling back to seed dataset. "
                f"Actuals received: {len(live_actuals)}, "
                f"Forecasts received: {len(live_forecasts_raw)}"
            )
            self._data_source = "seed_dataset"
            actuals_to_insert, forecasts_to_insert = generate_january_2026_data()

        # 3. Clear existing data and insert fresh
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM actual_generation;")
            cursor.execute("DELETE FROM forecast_generation;")

            # Insert actuals
            cursor.executemany("""
                INSERT OR REPLACE INTO actual_generation (
                    start_time, settlement_date, settlement_period, fuel_type, generation_mw
                ) VALUES (
                    :startTime, :settlementDate, :settlementPeriod, :fuelType, :generation
                );
            """, actuals_to_insert)

            # Insert forecasts
            cursor.executemany("""
                INSERT OR REPLACE INTO forecast_generation (
                    start_time, settlement_date, settlement_period, publish_time, generation_mw
                ) VALUES (
                    :startTime, :settlementDate, :settlementPeriod, :publishTime, :generation
                );
            """, forecasts_to_insert)

            # Persist ingestion metadata
            cursor.execute("""
                INSERT OR REPLACE INTO metadata (key, value)
                VALUES ('data_source', ?);
            """, (self._data_source,))

        new_stats = self.get_database_stats()
        logger.info(f"Database sync complete. Source: {self._data_source}, Stats: {new_stats}")
        return {
            "status": "success",
            "source": self._data_source,
            **new_stats
        }

pipeline = DataPipeline()
