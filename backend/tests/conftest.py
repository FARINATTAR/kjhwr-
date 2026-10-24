"""
Pytest configuration and global fixtures.
Ensures the SQLite database is properly seeded on fresh CI runners.
"""
import pytest
from app.ingestion.pipeline import pipeline

@pytest.fixture(scope="session", autouse=True)
def ensure_database_ready():
    """Seeds the SQLite database if it's empty so all integration tests pass on CI."""
    pipeline.seed_database_if_needed()
