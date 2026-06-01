from backend.db.db_service import db_service
import time
import requests

from backend.core.config import WEBHOOK_ALERT_URL


class AlertService:
    def __init__(self):
        self.cooldown_seconds = 60
        self.last_alerts = {}

    def should_alert(self, threat_type):
        now = time.time()

        if threat_type not in self.last_alerts:
            self.last_alerts[threat_type] = now
            return True

        elapsed = now - self.last_alerts[threat_type]

        if elapsed >= self.cooldown_seconds:
            self.last_alerts[threat_type] = now
            return True

        return False

    def send_discord(self, payload):
        if not WEBHOOK_ALERT_URL:
            print("[WARN] Discord webhook URL missing.")

            db_service.create_alert_log(
                channel="discord",
                status="FAILED",
                message="Webhook URL missing"
            )

            return

        severity = payload["severity"]

        color_map = {
            "LOW": 65280,
            "MEDIUM": 16776960,
            "HIGH": 16753920,
            "CRITICAL": 16711680
        }

        discord_payload = {
            "embeds": [
                {
                    "title": "🚨 RF Threat Detected",
                    "color": color_map.get(
                        severity,
                        16777215
                    ),
                    "fields": [
                        {
                            "name": "Threat Type",
                            "value": str(payload["threat_type"]),
                            "inline": True
                        },
                        {
                            "name": "Severity",
                            "value": str(payload["severity"]),
                            "inline": True
                        },
                        {
                            "name": "Confidence",
                            "value": f"{payload['confidence']}%",
                            "inline": True
                        },
                        {
                            "name": "Score",
                            "value": str(payload["score"]),
                            "inline": False
                        },
                        {
                            "name": "Min Value",
                            "value": f"{payload.get('min_value', 'N/A')} dBm",
                            "inline": True
                        },
                        {
                            "name": "Max Value",
                            "value": f"{payload.get('max_value', 'N/A')} dBm",
                            "inline": True
                        },
                        {
                            "name": "Latency",
                            "value": f"{payload.get('latency', 0.0):.2f} ms",
                            "inline": True
                        },
                        {
                            "name": "Summary",
                            "value": str(payload["summary"]),
                            "inline": False
                        },
                        {
                            "name": "Timestamp",
                            "value": str(payload["timestamp"]),
                            "inline": False
                        }
                    ]
                }
            ]
        }

        try:
            response = requests.post(
                WEBHOOK_ALERT_URL,
                json=discord_payload,
                timeout=10
            )

            print(
                f"[INFO] Discord response: "
                f"{response.status_code}"
            )

            if response.status_code in [200, 204]:
                print("[INFO] Discord alert sent.")

                db_service.create_alert_log(
                    channel="discord",
                    status="SUCCESS",
                    message=payload["summary"]
                )

            else:
                print(response.text)

                db_service.create_alert_log(
                    channel="discord",
                    status="FAILED",
                    message=response.text
                )

        except Exception as e:
            print(f"[WARN] Discord alert failed: {e}")

            db_service.create_alert_log(
                channel="discord",
                status="FAILED",
                message=str(e)
            )

    def dispatch(self, intelligence, score, latency_ms=None, min_power=None, max_power=None):
        severity = intelligence["severity"]
        threat = intelligence["threat_type"]

        if severity not in ["HIGH", "CRITICAL"]:
            return False

        if not self.should_alert(threat):
            return False

        payload = {
            "threat_type": threat,
            "severity": severity,
            "confidence": intelligence["confidence"],
            "summary": intelligence["summary"],
            "score": score,
            "latency": latency_ms,
            "min_value": min_power,
            "max_value": max_power,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }

        self.send_discord(payload)

        # Publish matching alert payloads directly to MQTT
        if hasattr(self, "mqtt") and self.mqtt:
            self.mqtt.publish("rf/alerts", payload)
            self.mqtt.publish("rf/threats", payload)

        db_service.create_incident(
            status="ANOMALY",
            score=score,
            threat_type=threat,
            severity=severity,
            confidence=intelligence["confidence"],
            summary=intelligence["summary"],
            latency=latency_ms,
            min_value=min_power,
            max_value=max_power,
            timestamp=payload["timestamp"]
        )

        print(f"[ALERT] {payload}")

        return payload