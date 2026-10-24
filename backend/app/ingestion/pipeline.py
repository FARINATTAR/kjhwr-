"""
Data ingestion pipeline coordinating data fetching, validation, and storage.
Supports both live Elexon BMRS ingestion and fallback high-fidelity seed data.
"""
import logging
from typing import Dict, Any
from app.database import get_db, init_db
from app.ingestion.elexon_client import ElexonClient
from app.ingestion.seed_data import generate_january_2026_data

logger = logging.getLogger(__name__)

class DataPipeline:
    def __init__(self):
        self.client = ElexonClient()
        init_db()

    def get_database_stats(self) -> Dict[str, int]:
        """Returns row counts of actual and forecast tables."""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM actual_generation;")
            actuals_count = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM forecast_generation;")
            forecasts_count = cursor.fetchone()[0]
            return {
                "actuals_count": actuals_count,
                "forecasts_count": forecasts_count
            }

    def seed_database_if_needed(self, force: bool = False) -> Dict[str, Any]:
        """
        Ensures the January 2026 dataset is present in SQLite.
        If tables are empty or force is True, ingests data.
        """
        stats = self.get_database_stats()
        if not force and stats["actuals_count"] > 0 and stats["forecasts_count"] > 0:
            logger.info(f"Database already populated: {stats}")
            return {
                "status": "already_populated",
                "source": "cached_store",
                **stats
            }

        logger.info("Attempting to populate January 2026 dataset...")
        
        # 1. Try Live Elexon API First
        live_actuals = self.client.fetch_fuelhh_stream("2026-01-01", "2026-01-31", fuel_type="WIND")
        live_forecasts = []
        if live_actuals:
            live_forecasts = self.client.fetch_windfor_stream(
                publish_from="2025-12-31T00:00:00Z",
                publish_to="2026-01-31T23:59:59Z"
            )

        data_source = "live_elexon"
        if not live_actuals or not live_forecasts:
            logger.info("Live Elexon stream unavailable or returned empty; switching to verified seed dataset.")
            data_source = "seed_dataset"
            actuals_to_insert, forecasts_to_insert = generate_january_2026_data()
        else:
            actuals_to_insert = live_actuals
            forecasts_to_insert = live_forecasts

        # 2. Insert into SQLite in batch transactions
        with get_db() as conn:
            cursor = conn.cursor()
            
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

        new_stats = self.get_database_stats()
        logger.info(f"Database sync complete. Source: {data_source}, Stats: {new_stats}")
        return {
            "status": "success",
            "source": data_source,
            **new_stats
        }

pipeline = DataPipeline()
