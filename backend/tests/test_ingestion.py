"""
Unit tests for data ingestion pipeline and database consistency.
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

def test_january_2026_data_counts():
    stats = pipeline.get_database_stats()
    # 31 days * 48 settlement periods = 1,488 half-hour slots
    assert stats["actuals_count"] == 1488
    # 4 distinct forecast horizons per half-hour slot = 5,952
    assert stats["forecasts_count"] == 5952

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
