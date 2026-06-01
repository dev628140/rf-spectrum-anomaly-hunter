import asyncio
import json
import random
import time

import numpy as np

from fastapi import APIRouter
from fastapi import WebSocket
from fastapi import WebSocketDisconnect

from backend.services.service_container import rf_state_service
from backend.services.event_service import load_state

router = APIRouter()


@router.websocket("/ws/live")
async def websocket_live(
    websocket: WebSocket
):
    await websocket.accept()

    print("WEBSOCKET CONNECTED")

    try:
        while True:
            # Fetch real spectrum & state from services
            try:
                rf_payload = rf_state_service.get_current()
                state = load_state()
            except Exception as service_err:
                print(f"[WS] Error loading real state: {service_err}")
                rf_payload = None
                state = {}

            if rf_payload and "spectrum" in rf_payload:
                # We have real processed data! Stream official contract
                payload = {
                    "signal": {
                        "spectrum": rf_payload["spectrum"],
                        "waterfall": rf_payload.get("waterfall", []), # Inject backend rolling DSP waterfall history
                        "metrics": {
                            "mean_power": rf_payload["metrics"].get("mean_power", 0.0),
                            "peak_power": rf_payload["metrics"].get("peak_power", 0.0),
                            "occupancy": rf_payload["metrics"].get("occupancy", 0.0),
                            "dynamic_range": rf_payload["metrics"].get("dynamic_range", 0.0)
                        }
                    },
                    "status": {
                        "state": state.get("status", "NORMAL"),
                        "active_model": state.get("active_model", "autoencoder"),
                        "score": state.get("score", 0.0),
                        "threshold": state.get("threshold", 0.0),
                        "model_scores": state.get("model_scores", {
                            "autoencoder": {
                                "status": state.get("status", "NORMAL"),
                                "score": state.get("score", 0.0),
                                "latency": 6.20,
                                "timestamp": state.get("timestamp", "00:00:00.000")[:12],
                                "threat_type": "normal" if state.get("status", "NORMAL") == "NORMAL" else "spoofing"
                            },
                            "random_forest": {
                                "status": state.get("status", "NORMAL"),
                                "score": state.get("score", 0.0) * 0.9,
                                "latency": 7.40,
                                "timestamp": state.get("timestamp", "00:00:00.000")[:12],
                                "threat_type": "normal" if state.get("status", "NORMAL") == "NORMAL" else "wideband_interference"
                            },
                            "knn": {
                                "status": "NORMAL",
                                "score": 0.0,
                                "latency": 880.20,
                                "timestamp": state.get("timestamp", "00:00:00.000")[:12],
                                "threat_type": "normal"
                            }
                        })
                    }
                }
            else:
                # FAKE FFT DATA (128 bins, matching waterfall)
                fft = []
                current_time = time.time()
                for i in range(128):
                    freq = 88.0 + (i / 128.0) * 20.0
                    power = -80.0 + np.sin(i / 8.0 - current_time * 0.5) * 12.0 + np.random.randn() * 2.5
                    
                    # Major peak around 97.4 MHz (bin 60)
                    if 55 < i < 65:
                        power += 38.0 + np.sin(current_time) * 6.0
                    # Secondary peak around 102.6 MHz (bin 93)
                    if 90 < i < 96:
                        power += 25.0 + np.cos(-current_time * 0.8) * 4.0
                        
                    fft.append({
                        "frequency": round(freq, 3),
                        "power": round(power, 2)
                    })

                # Generate a beautiful scrolling simulated waterfall history (30 rows x 128 cols)
                simulated_waterfall = []
                for r in range(29, -1, -1):
                    row = []
                    row_time = current_time - (r * 1.0)
                    for c in range(128):
                        power = -80.0 + np.sin(c / 8.0 - row_time * 0.5) * 12.0 + np.random.randn() * 1.5
                        # Primary spike
                        if 55 < c < 65:
                            power += 38.0 + np.sin(row_time) * 6.0
                        # Secondary spike
                        if 90 < c < 96:
                            power += 25.0 + np.cos(-row_time * 0.8) * 4.0
                        row.append(round(power, 2))
                    simulated_waterfall.append(row)

                threat_state = random.choice([
                    "NORMAL",
                    "INTERFERENCE",
                    "JAMMING",
                    "SPOOFING"
                ])

                # For simulated state, generate distinct simulated scores for all three models
                ae_score = round(random.uniform(0.01, 0.15) if threat_state == "NORMAL" else random.uniform(0.65, 0.92), 4)
                rf_score = round(random.uniform(0.02, 0.12) if threat_state == "NORMAL" else random.uniform(0.70, 0.95), 4)
                knn_score = round(random.uniform(0.01, 0.18) if threat_state == "NORMAL" else random.uniform(0.60, 0.88), 4)

                from datetime import datetime
                time_str = datetime.now().strftime("%H:%M:%S.%f")[:-3]

                active_model = state.get("active_model", "autoencoder")
                active_score = ae_score
                if active_model == "random_forest":
                    active_score = rf_score
                elif active_model == "knn":
                    active_score = knn_score

                payload = {
                    "signal": {
                        "spectrum": fft,
                        "waterfall": simulated_waterfall,
                        "metrics": {
                            "mean_power": round(random.uniform(-45, -25), 2),
                            "peak_power": round(random.uniform(-20, -5), 2),
                            "occupancy": round(random.uniform(0, 1), 2),
                            "dynamic_range": round(random.uniform(40, 70), 2)
                        }
                    },
                    "status": {
                        "state": threat_state,
                        "active_model": active_model,
                        "score": active_score,
                        "threshold": 0.5,
                        "model_scores": {
                            "autoencoder": {
                                "status": "ANOMALY" if ae_score > 0.5 else "NORMAL",
                                "score": ae_score,
                                "latency": round(random.uniform(4.5, 8.5), 2),
                                "timestamp": time_str,
                                "threat_type": "normal" if ae_score <= 0.5 else random.choice(["jammer", "spoofing", "burst_attack"])
                            },
                            "random_forest": {
                                "status": "ANOMALY" if rf_score > 0.5 else "NORMAL",
                                "score": rf_score,
                                "latency": round(random.uniform(5.0, 9.5), 2),
                                "timestamp": time_str,
                                "threat_type": "normal" if rf_score <= 0.5 else random.choice(["wideband_interference", "burst_attack"])
                            },
                            "knn": {
                                "status": "ANOMALY" if knn_score > 0.5 else "NORMAL",
                                "score": knn_score,
                                "latency": round(random.uniform(820.0, 960.0), 2),
                                "timestamp": time_str,
                                "threat_type": "normal" if knn_score <= 0.5 else random.choice(["spoofing", "jammer"])
                            }
                        }
                    }
                }

            await websocket.send_text(
                json.dumps(payload)
            )

            await asyncio.sleep(1)

    except WebSocketDisconnect:
        print("WEBSOCKET DISCONNECTED")

    except Exception as e:
        print("WS ERROR:", e)