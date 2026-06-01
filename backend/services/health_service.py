import json
import time
from datetime import datetime

from backend.core.config import HEALTH_PATH


class HealthService:
    def __init__(self, mode, adapter_name):
        self.start_time = time.time()
        self.mode = mode
        self.adapter_name = adapter_name

        self.total_inferences = 0
        self.total_anomalies = 0

        self.last_detection_time = None
        self.last_status = None
        self.last_score = None

        self.total_latency_ms = 0.0

    def record(self, status, score, latency_ms):
        self.total_inferences += 1

        if status == "ANOMALY":
            self.total_anomalies += 1

        self.last_detection_time = datetime.now().isoformat()
        self.last_status = status
        self.last_score = score

        self.total_latency_ms += latency_ms

        self.persist()

    def snapshot(self):
        uptime = int(time.time() - self.start_time)

        avg_latency = (
            self.total_latency_ms / self.total_inferences
            if self.total_inferences > 0
            else 0
        )

        return {
            "uptime_seconds": uptime,
            "runtime_mode": self.mode,
            "adapter_name": self.adapter_name,
            "total_inferences": self.total_inferences,
            "total_anomalies": self.total_anomalies,
            "last_detection_time": self.last_detection_time,
            "last_status": self.last_status,
            "last_score": self.last_score,
            "avg_inference_latency_ms": round(avg_latency, 2)
        }

    def persist(self):
        with open(HEALTH_PATH, "w") as f:
            json.dump(self.snapshot(), f, indent=2)