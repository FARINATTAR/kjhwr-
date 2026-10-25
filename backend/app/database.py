"""
Database manager providing SQLite connection, table schemas, and indexing
optimized for fast time-series queries and settlement period lookups.
"""
import sqlite3
from contextlib import contextmanager
from typing import Generator
from app.config import settings

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(settings.db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    return conn

@contextmanager
def get_db() -> Generator[sqlite3.Connection, None, None]:
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db() -> None:
    """Create tables and indexes if they do not exist."""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Actuals Table (Elexon FUELHH filtered to WIND)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS actual_generation (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                start_time TEXT NOT NULL,
                settlement_date TEXT NOT NULL,
                settlement_period INTEGER NOT NULL,
                fuel_type TEXT NOT NULL DEFAULT 'WIND',
                generation_mw REAL NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(start_time, fuel_type)
            );
        """)
        
        # 2. Forecasts Table (Elexon WINDFOR)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS forecast_generation (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                start_time TEXT NOT NULL,
                settlement_date TEXT NOT NULL,
                settlement_period INTEGER NOT NULL,
                publish_time TEXT NOT NULL,
                generation_mw REAL NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(start_time, publish_time)
            );
        """)
        
        # 3. Ingestion Metadata Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS metadata (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # 4. Create indexes for high-speed filtering and join performance
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_actual_start ON actual_generation(start_time);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_actual_date_sp ON actual_generation(settlement_date, settlement_period);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_forecast_start ON forecast_generation(start_time);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_forecast_publish ON forecast_generation(publish_time);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_forecast_start_pub ON forecast_generation(start_time, publish_time);")
