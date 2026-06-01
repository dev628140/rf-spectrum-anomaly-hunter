import os
import time
import joblib

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

from backend.ml.classification.threat_dataset import (
    build_multiclass_dataset,
    CLASS_MAP
)


MODEL_PATH = os.path.join(
    os.path.dirname(
        os.path.dirname(
            os.path.dirname(
                os.path.dirname(os.path.abspath(__file__))
            )
        )
    ),
    "models",
    "threat_classifier.pkl"
)


def train():
    print("Building multiclass RF threat dataset...")

    X, y = build_multiclass_dataset()

    print("Dataset built.")
    print(X.shape)

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )

    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=30,
        random_state=42,
        n_jobs=-1
    )

    print("Training threat classifier...")

    start = time.time()

    model.fit(X_train, y_train)

    duration = time.time() - start

    preds = model.predict(X_test)

    print("\n===== THREAT CLASSIFIER RESULTS =====")
    print(f"Accuracy: {accuracy_score(y_test, preds):.4f}")
    print(f"Train time: {duration:.2f} sec")
    print()

    print(
        classification_report(
            y_test,
            preds,
            target_names=[
                CLASS_MAP[0],
                CLASS_MAP[1],
                CLASS_MAP[2],
                CLASS_MAP[3],
                CLASS_MAP[4]
            ]
        )
    )

    joblib.dump(model, MODEL_PATH)

    print("Threat classifier saved.")


if __name__ == "__main__":
    train()