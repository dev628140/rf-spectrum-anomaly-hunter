import os
import joblib
import numpy as np

from backend.ml.autoencoder.loader import load_model
from backend.ml.autoencoder.predictor import predict


BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(os.path.abspath(__file__))
    )
)

KNN_PATH = os.path.join(
    BASE_DIR,
    "models",
    "knn_model.pkl"
)

RF_PATH = os.path.join(
    BASE_DIR,
    "models",
    "random_forest.pkl"
)

ACTIVE_MODEL_PATH = os.path.join(
    BASE_DIR,
    "backend",
    "active_model.json"
)



class ModelRegistry:
    def __init__(self):
        self.models = {}
        self.current_model = "autoencoder"

        self._load_models()

    def _load_models(self):
        ae_model, ae_threshold, ae_device = load_model()

        self.models["autoencoder"] = {
            "type": "autoencoder",
            "model": ae_model,
            "threshold": ae_threshold,
            "device": ae_device
        }

        self.models["knn"] = {
            "type": "sklearn",
            "model": joblib.load(KNN_PATH)
        }

        self.models["random_forest"] = {
            "type": "sklearn",
            "model": joblib.load(RF_PATH)
        }

    def available_models(self):
        return list(self.models.keys())

    def get_current_model(self):
        import json
        if os.path.exists(ACTIVE_MODEL_PATH):
            try:
                with open(ACTIVE_MODEL_PATH, "r") as f:
                    data = json.load(f)
                    model_name = data.get("active_model", "autoencoder")
                    if model_name in self.models:
                        self.current_model = model_name
            except Exception as e:
                print(f"[ModelRegistry] Error loading active model config: {e}")
        return self.current_model

    def switch_model(self, model_name):
        if model_name not in self.models:
            raise ValueError(
                f"Unknown model: {model_name}"
            )

        self.current_model = model_name

        import json
        import time
        payload = {"active_model": model_name}
        temp_path = ACTIVE_MODEL_PATH + ".tmp"
        for i in range(5):
            try:
                with open(temp_path, "w") as f:
                    json.dump(payload, f)
                os.replace(temp_path, ACTIVE_MODEL_PATH)
                break
            except PermissionError:
                time.sleep(0.01)
            except Exception:
                try:
                    with open(ACTIVE_MODEL_PATH, "w") as f:
                        json.dump(payload, f)
                except Exception:
                    pass
                break
        else:
            try:
                with open(ACTIVE_MODEL_PATH, "w") as f:
                    json.dump(payload, f)
            except Exception:
                pass

    def predict(self, window):
        config = self.models[self.current_model]

        if config["type"] == "autoencoder":
            return predict(
                window,
                config["model"],
                config["threshold"],
                config["device"]
            )

        flattened = window.flatten().reshape(1, -1)

        model = config["model"]

        pred = model.predict(flattened)[0]
        prob = model.predict_proba(flattened)[0][1]

        status = "ANOMALY" if pred == 1 else "NORMAL"

        return status, float(prob)

    def predict_all(self, window):
        results = {}
        for name, config in self.models.items():
            try:
                import time
                from datetime import datetime
                start_t = time.time()
                
                if config["type"] == "autoencoder":
                    status, score = predict(
                        window,
                        config["model"],
                        config["threshold"],
                        config["device"]
                    )
                else:
                    flattened = window.flatten().reshape(1, -1)
                    model = config["model"]
                    pred = model.predict(flattened)[0]
                    prob = model.predict_proba(flattened)[0][1]
                    status = "ANOMALY" if pred == 1 else "NORMAL"
                    score = float(prob)
                
                latency = (time.time() - start_t) * 1000
                
                # Enforce threat type classification if anomalous
                if status == "ANOMALY":
                    from backend.services.intelligence_service import classifier
                    threat_res = classifier.classify(window)
                    threat_type = threat_res["threat_type"]
                else:
                    threat_type = "normal"
                
                results[name] = {
                    "status": status,
                    "score": score,
                    "latency": round(latency, 2),
                    "timestamp": datetime.now().strftime("%H:%M:%S.%f")[:-3],
                    "threat_type": threat_type
                }
            except Exception as e:
                from datetime import datetime
                print(f"[ModelRegistry] Error running {name}: {e}")
                results[name] = {
                    "status": "ERROR",
                    "score": 0.0,
                    "latency": 0.0,
                    "timestamp": datetime.now().strftime("%H:%M:%S.%f")[:-3],
                    "threat_type": "unknown"
                }
        return results