import numpy as np

from sklearn.model_selection import StratifiedKFold
from sklearn.neighbors import KNeighborsClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score
)

from backend.ml.benchmarking.dataset_loader import load_all_samples


def evaluate_model(model, X, y, model_name):
    skf = StratifiedKFold(
        n_splits=5,
        shuffle=True,
        random_state=42
    )

    metrics = {
        "accuracy": [],
        "precision": [],
        "recall": [],
        "f1": [],
        "roc_auc": []
    }

    fold = 1

    for train_idx, test_idx in skf.split(X, y):
        print(f"\nRunning {model_name} fold {fold}/5...")

        X_train = X[train_idx]
        X_test = X[test_idx]

        y_train = y[train_idx]
        y_test = y[test_idx]

        model.fit(X_train, y_train)

        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test)[:, 1]

        metrics["accuracy"].append(
            accuracy_score(y_test, y_pred)
        )

        metrics["precision"].append(
            precision_score(y_test, y_pred)
        )

        metrics["recall"].append(
            recall_score(y_test, y_pred)
        )

        metrics["f1"].append(
            f1_score(y_test, y_pred)
        )

        metrics["roc_auc"].append(
            roc_auc_score(y_test, y_prob)
        )

        fold += 1

    print(f"\n===== {model_name} CROSS-VALIDATION RESULTS =====")

    for metric, values in metrics.items():
        print(
            f"{metric}: "
            f"{np.mean(values):.4f} ± {np.std(values):.4f}"
        )

    return metrics


def main():
    print("Loading full dataset...")

    X, y = load_all_samples(flatten=True)

    print("Dataset loaded.")
    print(X.shape)

    knn = KNeighborsClassifier(
        n_neighbors=5,
        weights="distance",
        metric="euclidean"
    )

    rf = RandomForestClassifier(
        n_estimators=200,
        max_depth=25,
        random_state=42,
        n_jobs=-1
    )

    evaluate_model(knn, X, y, "KNN")
    evaluate_model(rf, X, y, "Random Forest")


if __name__ == "__main__":
    main()