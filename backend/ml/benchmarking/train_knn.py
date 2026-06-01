import os
import time
import joblib

from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score
)

from backend.ml.benchmarking.dataset_loader import get_supervised_split


MODEL_PATH = os.path.join(
    os.path.dirname(
        os.path.dirname(
            os.path.dirname(
                os.path.dirname(os.path.abspath(__file__))
            )
        )
    ),
    "models",
    "knn_model.pkl"
)


def train_knn():
    print("Loading supervised dataset...")

    X_train, X_test, y_train, y_test = get_supervised_split()

    print("Dataset loaded.")
    print("Training KNN baseline...")

    model = KNeighborsClassifier(
        n_neighbors=5,
        weights="distance",
        metric="euclidean"
    )

    start_train = time.time()

    model.fit(X_train, y_train)

    train_time = time.time() - start_train

    print(f"KNN training completed in {train_time:.2f} sec")

    start_infer = time.time()

    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    infer_time = time.time() - start_infer

    metrics = {
        "accuracy": accuracy_score(y_test, y_pred),
        "precision": precision_score(y_test, y_pred),
        "recall": recall_score(y_test, y_pred),
        "f1": f1_score(y_test, y_pred),
        "roc_auc": roc_auc_score(y_test, y_prob),
        "train_time_sec": round(train_time, 2),
        "inference_time_sec": round(infer_time, 2)
    }

    joblib.dump(model, MODEL_PATH)

    print("KNN model saved.")
    print(metrics)

    return metrics


if __name__ == "__main__":
    train_knn()