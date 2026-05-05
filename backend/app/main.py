"""FastAPI application entry point — mounts all routers and manages lifecycle."""

import os
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import get_settings
from app.core.database import connect_to_mongo, close_mongo_connection
from app.api.routes import auth, invoices, validate, reconcile, itc, assistant, seed
from app.api.routes import analytics

settings = get_settings()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup
    logger.info("Starting GST Compliance Assistant API...")
    await connect_to_mongo()

    # Ensure upload and demo directories exist
    Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
    Path(settings.DEMO_DOCS_DIR).mkdir(parents=True, exist_ok=True)

    logger.info("API ready")
    yield

    # Shutdown
    await close_mongo_connection()
    logger.info("API shutdown complete")


app = FastAPI(
    title="GST Compliance Assistant API",
    description="AI-powered GST compliance and ITC reconciliation platform",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(auth.router)
app.include_router(invoices.router)
app.include_router(validate.router)
app.include_router(reconcile.router)
app.include_router(itc.router)
app.include_router(assistant.router)
app.include_router(seed.router)
app.include_router(analytics.router)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "GST Compliance Assistant API",
        "version": "1.0.0",
    }


@app.get("/api/health")
async def health_check():
    """Detailed health check."""
    from app.core.database import get_database
    try:
        db = get_database()
        await db.command("ping")
        db_status = "connected"
    except Exception:
        db_status = "disconnected"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "database": db_status,
        "version": "1.0.0",
    }
