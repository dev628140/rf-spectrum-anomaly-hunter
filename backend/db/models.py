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

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    timestamp = Column(
        DateTime,
        default=datetime.utcnow
    )

    status = Column(
        String(50)
    )

    score = Column(
        Float
    )

    threat_type = Column(
        String(100)
    )

    severity = Column(
        String(50)
    )

    confidence = Column(
        Float
    )

    summary = Column(
        Text
    )


class AlertLog(Base):
    __tablename__ = "alert_logs"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    timestamp = Column(
        DateTime,
        default=datetime.utcnow
    )

    channel = Column(
        String(50)
    )

    status = Column(
        String(50)
    )

    message = Column(
        Text
    )


class RFMetric(Base):
    __tablename__ = "rf_metrics"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    timestamp = Column(
        DateTime,
        default=datetime.utcnow
    )

    mean_power = Column(
        Float
    )

    peak_power = Column(
        Float
    )

    min_power = Column(
        Float
    )

    dynamic_range = Column(
        Float
    )

    occupancy_percent = Column(
        Float
    )


class ModelSwitch(Base):
    __tablename__ = "model_switches"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    timestamp = Column(
        DateTime,
        default=datetime.utcnow
    )

    from_model = Column(
        String(100)
    )

    to_model = Column(
        String(100)
    )


class Operator(Base):
    __tablename__ = "operators"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String(100),
        nullable=False
    )

    role = Column(
        String(100),
        nullable=False
    )

    level = Column(
        String(50),
        nullable=False
    )

    status = Column(
        String(50),
        default="ACTIVE"
    )

    avatar = Column(
        String(10),
        nullable=False
    )

    color = Column(
        String(200),
        nullable=True
    )

    scope = Column(
        Text,
        nullable=True
    )