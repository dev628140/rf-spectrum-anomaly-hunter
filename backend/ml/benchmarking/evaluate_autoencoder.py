import time
import numpy as np

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score
)

from backend.ml.benchmarking.dataset_loader import get_autoencoder_split
from backend.services.inference_service import InferenceService


def evaluate_autoencoder():
    print("Loading benchmark dataset...")

    train_normals, X_test, y_test = get_autoencoder_split()

    print("Dataset loaded.")
    print("Loading production autoencoder...")

    inference = InferenceService()

    print("Evaluating autoencoder...")

    y_pred = []
    anomaly_scores = []

    start = time.time()

    for sample in X_test:
        status, score = inference.predict(sample)

        anomaly_scores.append(score)

        if status == "ANOMALY":
            y_pred.append(1)
        else:
            y_pred.append(0)

    total_time = time.time() - start

    y_pred = np.array(y_pred)
    anomaly_scores = np.array(anomaly_scores)

    metrics = {
        "accuracy": accuracy_score(y_test, y_pred),
        "precision": precision_score(y_test, y_pred),
        "recall": recall_score(y_test, y_pred),
        "f1": f1_score(y_test, y_pred),
        "roc_auc": roc_auc_score(y_test, anomaly_scores),
        "total_inference_time_sec": round(total_time, 2),
        "avg_inference_per_sample_ms": round(
            (total_time / len(X_test)) * 1000,
            2
        )
    }

    print("\n===== AUTOENCODER RESULTS =====")
    print(metrics)

    return metrics


if __name__ == "__main__":
    evaluate_autoencoder()