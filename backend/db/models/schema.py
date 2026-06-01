from sqlalchemy import (
    Column,
    Integer,
    Float,
    String,
    Text,
    DateTime
)
from datetime import datetime

from backend.db.database import Base


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50))
    score = Column(Float)
    threat_type = Column(String(100))
    severity = Column(String(50))
    confidence = Column(Float)
    summary = Column(Text)
    latency = Column(Float, nullable=True)
    min_value = Column(Float, nullable=True)
    max_value = Column(Float, nullable=True)


class AlertLog(Base):
    __tablename__ = "alert_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    channel = Column(String(50))
    status = Column(String(50))
    message = Column(Text)


class RFMetric(Base):
    __tablename__ = "rf_metrics"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    mean_power = Column(Float)
    peak_power = Column(Float)
    min_power = Column(Float)
    dynamic_range = Column(Float)
    occupancy_percent = Column(Float)


class ModelSwitch(Base):
    __tablename__ = "model_switches"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    from_model = Column(String(100))
    to_model = Column(String(100))