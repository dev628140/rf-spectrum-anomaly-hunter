import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "")

# Standardize postgres:// to postgresql:// for SQLAlchemy compatibility
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Robust fallback to SQLite if PostgreSQL fails or is not available after retries
engine = None
if "postgresql" in DATABASE_URL:
    import time
    print("[DATABASE] Attempting to connect to PostgreSQL...")
    for attempt in range(1, 6):
        try:
            # Use a short timeout of 2 seconds for testing the connection
            temp_engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args={"connect_timeout": 2})
            # Verify the connection works
            conn = temp_engine.connect()
            conn.close()
            engine = temp_engine
            print(f"[DATABASE] Successfully connected to PostgreSQL on attempt {attempt}.")
            break
        except Exception as e:
            print(f"[DATABASE] Connection attempt {attempt}/5 failed: {e}")
            if attempt < 5:
                print("[DATABASE] Sleeping 2 seconds before retry...")
                time.sleep(2)

if engine is None:
    print("[DATABASE] All PostgreSQL connection attempts failed or non-PostgreSQL URL. Falling back to SQLite.")
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
    from backend.db.models.schema import Incident, AlertLog, RFMetric, ModelSwitch, Operator, AccessRequest
    Base.metadata.create_all(bind=engine)
    print("[DATABASE] All tables verified/created successfully.")
except Exception as table_err:
    print(f"[DATABASE] Error during auto-creation of tables: {table_err}")