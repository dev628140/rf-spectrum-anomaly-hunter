import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5434/rfintel")

# Robust fallback to SQLite if PostgreSQL fails or is not available
try:
    if "postgresql" in DATABASE_URL:
        # Use a short timeout of 2 seconds for testing the connection
        engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args={"connect_timeout": 2})
        # Verify the connection works
        conn = engine.connect()
        conn.close()
        print("[DATABASE] Successfully connected to PostgreSQL.")
    else:
        raise ValueError("Non-PostgreSQL URL configured, falling back.")
except Exception as e:
    print(f"[DATABASE] PostgreSQL connection failed: {e}. Falling back to SQLite.")
    DB_DIR = os.path.dirname(os.path.abspath(__file__))
    sqlite_path = os.path.join(DB_DIR, "rfintel.db")
    DATABASE_URL = f"sqlite:///{sqlite_path}"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    print(f"[DATABASE] SQLite database initialized at: {sqlite_path}")

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

# Auto-create all tables
try:
    from backend.db.models.schema import Incident, AlertLog, RFMetric, ModelSwitch
    Base.metadata.create_all(bind=engine)
    print("[DATABASE] All tables verified/created successfully.")
except Exception as table_err:
    print(f"[DATABASE] Error during auto-creation of tables: {table_err}")