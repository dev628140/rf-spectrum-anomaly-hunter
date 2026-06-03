import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Ensure project root is in path
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from backend.db.models.schema import Incident, AlertLog, RFMetric, ModelSwitch, Operator

def migrate():
    # 1. Connect to local SQLite database
    sqlite_path = os.path.join(project_root, "backend", "db", "rfintel.db")
    if not os.path.exists(sqlite_path):
        print(f"[MIGRATION] SQLite database not found at {sqlite_path}. Nothing to migrate!")
        return

    sqlite_url = f"sqlite:///{sqlite_path}"
    print(f"[MIGRATION] Reading from local SQLite: {sqlite_path}")
    sqlite_engine = create_engine(sqlite_url)
    SqliteSession = sessionmaker(bind=sqlite_engine)
    sqlite_session = SqliteSession()

    # 2. Connect to target PostgreSQL database
    # Read from command line or default env variable
    pg_url = None
    if len(sys.argv) > 1:
        pg_url = sys.argv[1]
    else:
        # Try to read from environment or prompt
        pg_url = os.getenv("DATABASE_URL")
    
    if not pg_url or "postgresql" not in pg_url:
        print("\n[MIGRATION] ERROR: PostgreSQL DATABASE_URL not provided.")
        print("Usage: python backend/db/migrate_to_postgres.py <postgresql_connection_string>")
        print("Example: python backend/db/migrate_to_postgres.py postgresql://user:password@host:port/dbname\n")
        return

    print(f"[MIGRATION] Writing to target PostgreSQL database...")
    try:
        pg_engine = create_engine(pg_url, pool_pre_ping=True)
        # Verify connection
        conn = pg_engine.connect()
        conn.close()
    except Exception as conn_err:
        print(f"[MIGRATION] Connection to PostgreSQL failed: {conn_err}")
        return

    PgSession = sessionmaker(bind=pg_engine)
    pg_session = PgSession()

    # Create tables in PostgreSQL if they don't exist
    from backend.db.database import Base
    Base.metadata.create_all(bind=pg_engine)

    try:
        # --- A. Migrate Incidents ---
        incidents = sqlite_session.query(Incident).all()
        print(f"[MIGRATION] Found {len(incidents)} Incidents in SQLite. Migrating...")
        pg_session.query(Incident).delete()  # Clear existing target logs to prevent duplicates
        for inc in incidents:
            new_inc = Incident(
                id=inc.id,
                timestamp=inc.timestamp,
                status=inc.status,
                score=inc.score,
                threat_type=inc.threat_type,
                severity=inc.severity,
                confidence=inc.confidence,
                summary=inc.summary,
                latency=inc.latency,
                min_value=inc.min_value,
                max_value=inc.max_value
            )
            pg_session.add(new_inc)
        
        # --- B. Migrate AlertLogs ---
        alerts = sqlite_session.query(AlertLog).all()
        print(f"[MIGRATION] Found {len(alerts)} Alert Logs in SQLite. Migrating...")
        pg_session.query(AlertLog).delete()
        for alert in alerts:
            new_alert = AlertLog(
                id=alert.id,
                timestamp=alert.timestamp,
                channel=alert.channel,
                status=alert.status,
                message=alert.message
            )
            pg_session.add(new_alert)

        # --- C. Migrate RFMetrics ---
        metrics = sqlite_session.query(RFMetric).all()
        print(f"[MIGRATION] Found {len(metrics)} RF Metrics in SQLite. Migrating...")
        pg_session.query(RFMetric).delete()
        for metric in metrics:
            new_metric = RFMetric(
                id=metric.id,
                timestamp=metric.timestamp,
                mean_power=metric.mean_power,
                peak_power=metric.peak_power,
                min_power=metric.min_power,
                dynamic_range=metric.dynamic_range,
                occupancy_percent=metric.occupancy_percent
            )
            pg_session.add(new_metric)

        # --- D. Migrate ModelSwitches ---
        switches = sqlite_session.query(ModelSwitch).all()
        print(f"[MIGRATION] Found {len(switches)} Model Switch Events in SQLite. Migrating...")
        pg_session.query(ModelSwitch).delete()
        for switch in switches:
            new_switch = ModelSwitch(
                id=switch.id,
                timestamp=switch.timestamp,
                from_model=switch.from_model,
                to_model=switch.to_model
            )
            pg_session.add(new_switch)

        # --- E. Migrate Operators ---
        operators = sqlite_session.query(Operator).all()
        print(f"[MIGRATION] Found {len(operators)} Operators in SQLite. Migrating...")
        pg_session.query(Operator).delete()
        for op in operators:
            new_op = Operator(
                id=op.id,
                name=op.name,
                role=op.role,
                level=op.level,
                status=op.status,
                avatar=op.avatar,
                color=op.color,
                scope=op.scope
            )
            pg_session.add(new_op)

        # Commit transaction
        pg_session.commit()

        # --- F. Reset PostgreSQL Sequence Generators (CRITICAL) ---
        print("[MIGRATION] Resetting PostgreSQL serial key sequence generators...")
        from sqlalchemy import text
        for table in ["incidents", "alert_logs", "rf_metrics", "model_switches", "operators"]:
            try:
                pg_session.execute(text(f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), COALESCE(MAX(id), 1)) FROM {table};"))
            except Exception as seq_err:
                print(f"  [WARN] Failed to reset sequence for {table}: {seq_err}")
        pg_session.commit()

        print("[MIGRATION] SUCCESS! All records successfully migrated from SQLite to your PostgreSQL Cloud Database!")

    except Exception as e:
        pg_session.rollback()
        print(f"[MIGRATION] FAILED during write: {e}")
    finally:
        sqlite_session.close()
        pg_session.close()

if __name__ == "__main__":
    migrate()
