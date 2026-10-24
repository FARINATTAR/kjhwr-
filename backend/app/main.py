"""
Main FastAPI Application entry point for Energy Analytics.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.ingestion.pipeline import pipeline
from app.api.routes import router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database is seeded on startup
    pipeline.seed_database_if_needed()
    yield

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="UK Day-Ahead Wholesale Electricity Market Wind Generation Forecasting & Evaluation Portal",
    lifespan=lifespan
)

# Enable CORS for frontend applications (local & deployed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://kjhwr-jet.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(router)

@app.get("/")
def root():
    return {
        "app": settings.app_name,
        "version": settings.app_version,
        "status": "online",
        "docs_url": "/docs",
        "health_url": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
