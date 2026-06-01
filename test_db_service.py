from backend.db.db_service import db_service

db_service.create_incident(
    status="ANOMALY",
    score=0.91,
    threat_type="spoofing",
    severity="CRITICAL",
    confidence=96.2,
    summary="Manual DB test"
)

print("INCIDENT INSERTED")