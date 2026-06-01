import os
import time
import joblib

from sklearn.ensemble import RandomForestClassifier
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
    "random_forest.pkl"
)


def train_random_forest():
    print("Loading supervised dataset...")

    X_train, X_test, y_train, y_test = get_supervised_split()

    print("Dataset loaded.")
    print("Training Random Forest baseline...")

    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=25,
        random_state=42,
        n_jobs=-1
    )

    start_train = time.time()

    model.fit(X_train, y_train)

    train_time = time.time() - start_train

    print(f"Random Forest training completed in {train_time:.2f} sec")

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

    print("Random Forest model saved.")
    print(metrics)

    return metrics


if __name__ == "__main__":
    train_random_forest()