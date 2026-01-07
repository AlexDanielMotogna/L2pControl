"""
Manual database initialization script.

Use this script to manually create the database tables if automatic
initialization on app startup fails.

Usage:
    DATABASE_URL="postgresql://..." python init_db.py
"""

import os
import sys

# Add app directory to path
sys.path.insert(0, os.path.dirname(__file__))

from app.database import engine, Base
from app.models import PC, Session

def init_database():
    """Create all database tables"""
    print("=" * 50)
    print("L2pControl - Database Initialization")
    print("=" * 50)
    print()

    # Check if DATABASE_URL is set
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        # Mask password in URL for display
        display_url = db_url.split("@")[-1] if "@" in db_url else db_url
        print(f"Database: {display_url}")
    else:
        print("Database: SQLite (local)")

    print()
    print("Creating tables...")

    try:
        Base.metadata.create_all(bind=engine)
        print("✓ Tables created successfully!")
        print()
        print("Tables created:")
        print("  - pcs")
        print("  - sessions")
        print()
        print("=" * 50)
        print("Database initialization complete!")
        print("=" * 50)
        return 0
    except Exception as e:
        print(f"✗ Error creating tables: {e}")
        print()
        print("=" * 50)
        print("Database initialization failed!")
        print("=" * 50)
        return 1

if __name__ == "__main__":
    sys.exit(init_database())
