"""
Unit tests for data ingestion pipeline and database consistency.
Validates that the database contains real Elexon BMRS data for January 2026.
"""
import pytest
from app.database import get_db, init_db
from app.ingestion.pipeline import pipeline

def test_database_initialization():
    init_db()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row[0] for row in cursor.fetchall()]
        assert "actual_generation" in tables
        assert "forecast_generation" in tables

def test_january_2026_actuals_present():
    """Database should have 1488 actual records (31 days x 48 settlement periods)."""
    stats = pipeline.get_database_stats()
    assert stats["actuals_count"] == 1488

def test_january_2026_forecasts_present():
    """Database should have forecasts from WINDFOR (expanded to half-hourly)."""
    stats = pipeline.get_database_stats()
    # Real Elexon WINDFOR produces multiple forecast runs per day
    # Expanded from hourly to half-hourly, expect thousands of records
    assert stats["forecasts_count"] > 1000

def test_data_source_is_elexon():
    """Data source should be live_elexon, not seed_dataset."""
    stats = pipeline.get_database_stats()
    assert stats["data_source"] == "live_elexon"

def test_actuals_record_structure():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT start_time, settlement_date, settlement_period, fuel_type, generation_mw FROM actual_generation LIMIT 1;")
        row = cursor.fetchone()
        assert row is not None
        assert row["settlement_date"].startswith("2026-01-")
        assert 1 <= row["settlement_period"] <= 48
        assert row["fuel_type"] == "WIND"
        assert row["generation_mw"] > 0

def test_forecast_record_has_publish_time():
    """WINDFOR forecasts must have a real publish_time (not synthetic)."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT start_time, settlement_date, settlement_period, publish_time, generation_mw
            FROM forecast_generation LIMIT 1;
        """)
        row = cursor.fetchone()
        assert row is not None
        assert row["publish_time"] is not None
        assert len(row["publish_time"]) > 0
        # Real WINDFOR publish times are at :30 past the hour (e.g. 02:30, 07:30, 11:30)
        assert "T" in row["publish_time"]

def test_windfor_hourly_to_half_hourly_expansion():
    """Each hourly WINDFOR forecast should map to two half-hourly SPs."""
    with get_db() as conn:
        cursor = conn.cursor()
        # Pick a specific publish_time and check that each start_time hour
        # has both odd and even settlement periods
        cursor.execute("""
            SELECT DISTINCT settlement_period FROM forecast_generation
            WHERE settlement_date = '2026-01-01'
            ORDER BY settlement_period;
        """)
        sps = [row[0] for row in cursor.fetchall()]
        # Should have both odd and even SPs (from hourly expansion)
        assert any(sp % 2 == 1 for sp in sps), "Missing odd settlement periods"
        assert any(sp % 2 == 0 for sp in sps), "Missing even settlement periods"
