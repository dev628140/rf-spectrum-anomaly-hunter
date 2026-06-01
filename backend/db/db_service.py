from backend.db.database import SessionLocal
from backend.db.models.schema import (
    Incident,
    AlertLog,
    RFMetric,
    ModelSwitch
)


class DBService:
    def create_incident(
        self,
        status,
        score,
        threat_type,
        severity,
        confidence,
        summary,
        latency=None,
        min_value=None,
        max_value=None,
        timestamp=None
    ):
        db = SessionLocal()

        try:
            from datetime import datetime
            dt_timestamp = datetime.utcnow()
            if timestamp:
                try:
                    dt_timestamp = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S")
                except Exception:
                    pass

            incident = Incident(
                status=status,
                score=score,
                threat_type=threat_type,
                severity=severity,
                confidence=confidence,
                summary=summary,
                latency=latency,
                min_value=min_value,
                max_value=max_value,
                timestamp=dt_timestamp
            )

            db.add(incident)
            db.commit()
            db.refresh(incident)

            return incident

        finally:
            db.close()

    def create_alert_log(
        self,
        channel,
        status,
        message
    ):
        db = SessionLocal()

        try:
            alert = AlertLog(
                channel=channel,
                status=status,
                message=message
            )

            db.add(alert)
            db.commit()
            db.refresh(alert)

            return alert

        finally:
            db.close()

    def create_rf_metric(
        self,
        mean_power,
        peak_power,
        min_power,
        dynamic_range,
        occupancy_percent
    ):
        db = SessionLocal()

        try:
            metric = RFMetric(
                mean_power=mean_power,
                peak_power=peak_power,
                min_power=min_power,
                dynamic_range=dynamic_range,
                occupancy_percent=occupancy_percent
            )

            db.add(metric)
            db.commit()
            db.refresh(metric)

            return metric

        finally:
            db.close()

    def create_model_switch(
        self,
        from_model,
        to_model
    ):
        db = SessionLocal()

        try:
            switch = ModelSwitch(
                from_model=from_model,
                to_model=to_model
            )

            db.add(switch)
            db.commit()
            db.refresh(switch)

            return switch
        finally:
            db.close()
            
    def get_recent_incidents(self, limit=50):
        db = SessionLocal()

        try:
            return (
                db.query(Incident)
                .order_by(Incident.id.desc())
                .limit(limit)
                .all()
            )

        finally:
            db.close()


    def get_recent_alerts(self, limit=50):
        db = SessionLocal()

        try:
            return (
                db.query(AlertLog)
                .order_by(AlertLog.id.desc())
                .limit(limit)
                .all()
            )

        finally:
            db.close()


    def get_recent_metrics(self, limit=100):
        db = SessionLocal()

        try:
            return (
                db.query(RFMetric)
                .order_by(RFMetric.id.desc())
                .limit(limit)
                .all()
            )

        finally:
            db.close()


    def get_model_switches(self, limit=50):
        db = SessionLocal()

        try:
            return (
                db.query(ModelSwitch)
                .order_by(ModelSwitch.id.desc())
                .limit(limit)
                .all()
            )

        
        finally:
            db.close()


db_service = DBService()