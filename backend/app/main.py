from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from .database import engine, Base
from .routers import events, pcs, sessions

# Create tables
Base.metadata.create_all(bind=engine)

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


@app.get("/")
def root():
    return {"message": "L2pControl API", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}
