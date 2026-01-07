from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import logging

from .database import engine, Base
from .routers import events, pcs, sessions, websocket, admin

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create tables
logger.info("Initializing database tables...")
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")
except Exception as e:
    logger.error(f"Failed to create database tables: {e}")
    raise

app = FastAPI(title="L2pControl API", version="1.0.0")

# CORS middleware - allow origins from environment variable or defaults
allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(events.router)
app.include_router(pcs.router)
app.include_router(sessions.router)
app.include_router(websocket.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {"message": "L2pControl API", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}
