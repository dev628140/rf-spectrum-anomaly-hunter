from fastapi import APIRouter
from backend.db.db_service import db_service

router = APIRouter(prefix="/api/history")


@router.get("/incidents")
def get_incidents():
    rows = db_service.get_recent_incidents()

    return {
        "status": "OK",
        "data": [
            {
                "id": r.id,
                "timestamp": str(r.timestamp),
                "status": r.status,
                "score": r.score,
                "threat_type": r.threat_type,
                "severity": r.severity,
                "confidence": r.confidence,
                "summary": r.summary,
                "latency": r.latency,
                "min_value": r.min_value,
                "max_value": r.max_value
            }
            for r in rows
        ]
    }


@router.get("/alerts")
def get_alerts():
    rows = db_service.get_recent_alerts()

    return {
        "status": "OK",
        "data": [
            {
                "id": r.id,
                "timestamp": str(r.timestamp),
                "channel": r.channel,
                "status": r.status,
                "message": r.message
            }
            for r in rows
        ]
    }


@router.get("/metrics")
def get_metrics():
    rows = db_service.get_recent_metrics()

    return {
        "status": "OK",
        "data": [
            {
                "id": r.id,
                "timestamp": str(r.timestamp),
                "mean_power": r.mean_power,
                "peak_power": r.peak_power,
                "min_power": r.min_power,
                "dynamic_range": r.dynamic_range,
                "occupancy_percent": r.occupancy_percent
            }
            for r in rows
        ]
    }


@router.get("/model-switches")
def get_switches():
    rows = db_service.get_model_switches()

    return {
        "status": "OK",
        "data": [
            {
                "id": r.id,
                "timestamp": str(r.timestamp),
                "from_model": r.from_model,
                "to_model": r.to_model
            }
            for r in rows
        ]
    }