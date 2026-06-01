import json
from datetime import datetime

from backend.core.config import STATE_PATH, EVENT_PATH


class EventWriter:
    def write_state(
        self,
        status,
        score,
        threshold,
        active_model="autoencoder",
        intelligence=None,
        model_scores=None
    ):
        payload = {
            "status": status,
            "score": score,
            "threshold": threshold,
            "active_model": active_model,
            "timestamp": datetime.now().isoformat(),
            "intelligence": intelligence,
            "model_scores": model_scores or {}
        }

        import os
        import time
        temp_path = STATE_PATH + ".tmp"
        for i in range(5):
            try:
                with open(temp_path, "w") as f:
                    json.dump(payload, f, indent=2)
                os.replace(temp_path, STATE_PATH)
                break
            except PermissionError:
                time.sleep(0.01)  # Sleep 10ms and retry
            except Exception as e:
                # Fallback to standard direct write on any other exception
                try:
                    with open(STATE_PATH, "w") as f:
                        json.dump(payload, f, indent=2)
                except Exception:
                    pass
                break
        else:
            # Final fallback if retries are exhausted
            try:
                with open(STATE_PATH, "w") as f:
                    json.dump(payload, f, indent=2)
            except Exception:
                pass


    def append_event(self, status, score):
        line = (
            f"[{datetime.now()}] "
            f"{status} | Score={score:.10f}"
        )

        with open(EVENT_PATH, "a") as f:
            f.write(line + "\n")