from backend.db.database import SessionLocal
from backend.db.models.schema import (
    Incident,
    AlertLog,
    RFMetric,
    ModelSwitch,
    Operator
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
                timestamp=dt_timestamp,
                resolved=False
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

    def resolve_incident(self, incident_id):
        db = SessionLocal()
        try:
            incident = db.query(Incident).filter(Incident.id == incident_id).first()
            if incident:
                incident.resolved = True
                db.commit()
                db.refresh(incident)
                return incident
            return None
        finally:
            db.close()

    def get_all_operators(self):
        db = SessionLocal()
        try:
            return db.query(Operator).order_by(Operator.id.asc()).all()
        finally:
            db.close()

    def create_operator(self, name, role, level, status, avatar=None, color=None, scope=None, username=None, password=None):
        db = SessionLocal()
        try:
            # Auto-derive avatar and color if not provided
            if not avatar:
                initials = "".join([part[0] for part in name.split() if part])[:2].upper()
                avatar = initials if initials else "OP"
            if not color:
                colors = {
                    "Level 5 (ROOT)": "border-cyan-500/30 text-cyan-300 bg-cyan-500/10",
                    "Level 4 (SEC_ADMIN)": "border-purple-500/30 text-purple-300 bg-purple-500/10",
                    "Level 3 (OPERATOR)": "border-teal-500/30 text-teal-300 bg-teal-500/10",
                    "Level 2 (ANALYST)": "border-blue-500/30 text-blue-300 bg-blue-500/10",
                    "Level 1 (GUEST)": "border-slate-500/30 text-slate-400 bg-slate-500/5",
                }
                color = colors.get(level, "border-cyan-500/30 text-cyan-300 bg-cyan-500/10")

            op = Operator(
                name=name,
                role=role,
                level=level,
                status=status,
                avatar=avatar,
                color=color,
                scope=scope,
                username=username,
                password=password
            )
            db.add(op)
            db.commit()
            db.refresh(op)
            return op
        finally:
            db.close()

    def update_operator(self, operator_id, name, role, level, status, scope):
        db = SessionLocal()
        try:
            op = db.query(Operator).filter(Operator.id == operator_id).first()
            if op:
                op.name = name
                op.role = role
                op.level = level
                op.status = status
                op.scope = scope
                
                # Derive avatar
                initials = "".join([part[0] for part in name.split() if part])[:2].upper()
                op.avatar = initials if initials else "OP"
                
                # Derive color
                colors = {
                    "Level 5 (ROOT)": "border-cyan-500/30 text-cyan-300 bg-cyan-500/10",
                    "Level 4 (SEC_ADMIN)": "border-purple-500/30 text-purple-300 bg-purple-500/10",
                    "Level 3 (OPERATOR)": "border-teal-500/30 text-teal-300 bg-teal-500/10",
                    "Level 2 (ANALYST)": "border-blue-500/30 text-blue-300 bg-blue-500/10",
                    "Level 1 (GUEST)": "border-slate-500/30 text-slate-400 bg-slate-500/5",
                }
                op.color = colors.get(level, "border-cyan-500/30 text-cyan-300 bg-cyan-500/10")
                
                db.commit()
                db.refresh(op)
                return op
            return None
        finally:
            db.close()

    def delete_operator(self, operator_id):
        db = SessionLocal()
        try:
            op = db.query(Operator).filter(Operator.id == operator_id).first()
            if op:
                db.delete(op)
                db.commit()
                return True
            return False
        finally:
            db.close()

    def seed_default_operators(self):
        db = SessionLocal()
        try:
            # Check if operators table is empty
            count = db.query(Operator).count()
            if count == 0:
                print("[DATABASE] Seeding default operator records...")
                defaults = [
                    {
                        "name": "System Root Admin",
                        "role": "System Root Administrator",
                        "level": "Level 5 (ROOT)",
                        "status": "ACTIVE",
                        "avatar": "RA",
                        "color": "border-cyan-500/30 text-cyan-300 bg-cyan-500/10",
                        "scope": "live,alerts,analytics,history,models,explain,settings,users",
                        "username": "dev628140",
                        "password": "Kis123!hore"
                    }
                ]
                for data in defaults:
                    op = Operator(**data)
                    db.add(op)
                
                # Seed some realistic initial audit logs
                initial_audits = [
                    {"channel": "AUDIT", "status": "SUCCESS", "message": "Root login established from verified operator subnet: 192.168.1.42."},
                    {"channel": "AUDIT", "status": "SUCCESS", "message": "TLS access handshake established with edge node #001."},
                    {"channel": "AUDIT", "status": "SUCCESS", "message": "Access governance directory synchronized successfully with local SQLite database."}
                ]
                for audit in initial_audits:
                    log = AlertLog(
                        channel=audit["channel"],
                        status=audit["status"],
                        message=audit["message"]
                    )
                    db.add(log)
 
                db.commit()
                print("[DATABASE] Default operator and audit logs seeded successfully.")
        except Exception as seed_err:
            print(f"[DATABASE] Error during seeding operators: {seed_err}")
            db.rollback()
        finally:
            db.close()


db_service = DBService()