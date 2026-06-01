import os
import joblib

from backend.ml.classification.threat_dataset import CLASS_MAP


MODEL_PATH = os.path.join(
    os.path.dirname(
        os.path.dirname(
            os.path.dirname(os.path.abspath(__file__))
        )
    ),
    "models",
    "threat_classifier.pkl"
)


class ThreatClassifierService:
    def __init__(self):
        self.model = joblib.load(MODEL_PATH)

    def classify(self, window):
        x = window.flatten().reshape(1, -1)

        pred = self.model.predict(x)[0]
        probs = self.model.predict_proba(x)[0]

        confidence = float(max(probs) * 100)

        return {
            "class_id": int(pred),
            "threat_type": CLASS_MAP[int(pred)],
            "confidence": round(confidence, 2)
        }