import os
import numpy as np

from sklearn.model_selection import train_test_split


DATASET_ROOT = os.path.join(
    os.path.dirname(
        os.path.dirname(
            os.path.dirname(
                os.path.dirname(os.path.abspath(__file__))
            )
        )
    ),
    "real_rf_dataset",
    "processed"
)


NORMAL_DIR = os.path.join(DATASET_ROOT, "normal")
ANOMALY_DIR = os.path.join(DATASET_ROOT, "anomaly")


def load_npz_sample(path):
    sample = np.load(path)

    rf_window = sample["rf_window"].astype(np.float32)
    label = str(sample["label"])

    return rf_window, label


def load_all_samples(flatten=False):
    X = []
    y = []

    for filename in os.listdir(NORMAL_DIR):
        if not filename.endswith(".npz"):
            continue

        path = os.path.join(NORMAL_DIR, filename)

        rf_window, label = load_npz_sample(path)

        if flatten:
            rf_window = rf_window.flatten()

        X.append(rf_window)
        y.append(0)

    for filename in os.listdir(ANOMALY_DIR):
        if not filename.endswith(".npz"):
            continue

        path = os.path.join(ANOMALY_DIR, filename)

        rf_window, label = load_npz_sample(path)

        if flatten:
            rf_window = rf_window.flatten()

        X.append(rf_window)
        y.append(1)

    X = np.array(X)
    y = np.array(y)

    return X, y


def get_supervised_split(test_size=0.2):
    X, y = load_all_samples(flatten=True)

    return train_test_split(
        X,
        y,
        test_size=test_size,
        random_state=42,
        stratify=y
    )


def get_autoencoder_split(test_size=0.2):
    normal_samples = []

    for filename in os.listdir(NORMAL_DIR):
        if not filename.endswith(".npz"):
            continue

        path = os.path.join(NORMAL_DIR, filename)

        rf_window, _ = load_npz_sample(path)

        normal_samples.append(rf_window)

    normal_samples = np.array(normal_samples)

    train_normals, test_normals = train_test_split(
        normal_samples,
        test_size=test_size,
        random_state=42
    )

    anomaly_samples = []

    for filename in os.listdir(ANOMALY_DIR):
        if not filename.endswith(".npz"):
            continue

        path = os.path.join(ANOMALY_DIR, filename)

        rf_window, _ = load_npz_sample(path)

        anomaly_samples.append(rf_window)

    anomaly_samples = np.array(anomaly_samples)

    X_test = np.concatenate(
        [test_normals, anomaly_samples],
        axis=0
    )

    y_test = np.concatenate(
        [
            np.zeros(len(test_normals)),
            np.ones(len(anomaly_samples))
        ],
        axis=0
    )

    return train_normals, X_test, y_test