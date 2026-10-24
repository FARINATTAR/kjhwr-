"""
Application configuration for REint Wind Forecast & Procurement Analytics.
"""
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

class Settings(BaseModel):
    app_name: str = "REint Energy Analytics - UK Day-Ahead Wind Forecasting"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Elexon BMRS API Endpoints
    elexon_base_url: str = "https://data.elexon.co.uk/bmrs/api/v1"
    elexon_fuelhh_endpoint: str = "https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream"
    elexon_windfor_endpoint: str = "https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream"
    
    # Target Scope: January 2026
    target_start_date: str = "2026-01-01"
    target_end_date: str = "2026-01-31"
    
    # Default UK Day-Ahead Market Gate Closure Time (GMT) on D-1
    # Day-ahead auction runs around 11:00 - 12:00 GMT on D-1
    default_gate_closure_hour: int = 11
    default_gate_closure_minute: int = 0
    
    # Database path
    db_path: str = str(DATA_DIR / "reint_energy.db")

settings = Settings()
