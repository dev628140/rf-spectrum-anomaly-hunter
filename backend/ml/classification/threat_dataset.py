import numpy as np

from backend.ml.benchmarking.dataset_loader import load_all_samples


CLASS_MAP = {
    0: "normal",
    1: "jammer",
    2: "burst_attack",
    3: "wideband_interference",
    4: "spoofing"
}


def make_jammer(rf):
    noisy = rf.copy()

    lift = np.random.uniform(8, 15)

    noisy += lift

    return noisy


def make_burst_attack(rf):
    attacked = rf.copy()

    num_bursts = np.random.randint(3, 10)

    for _ in range(num_bursts):
        row = np.random.randint(0, attacked.shape[0])

        attacked[row, :] += np.random.uniform(15, 30)

    return attacked


def make_wideband_interference(rf):
    attacked = rf.copy()

    start = np.random.randint(0, 700)
    width = np.random.randint(80, 250)

    end = min(start + width, attacked.shape[1])

    attacked[:, start:end] += np.random.uniform(10, 20)

    return attacked


def make_spoofing(rf):
    attacked = rf.copy()

    num_peaks = np.random.randint(8, 20)

    for _ in range(num_peaks):
        col = np.random.randint(0, attacked.shape[1])

        attacked[:, col] += np.random.uniform(10, 25)

    return attacked


def build_multiclass_dataset():
    X_raw, y_binary = load_all_samples(flatten=False)

    X = []
    y = []

    for rf, label in zip(X_raw, y_binary):
        if label == 0:
            X.append(rf.flatten())
            y.append(0)

        else:
            variant = np.random.choice([1, 2, 3, 4])

            if variant == 1:
                sample = make_jammer(rf)

            elif variant == 2:
                sample = make_burst_attack(rf)

            elif variant == 3:
                sample = make_wideband_interference(rf)

            else:
                sample = make_spoofing(rf)

            X.append(sample.flatten())
            y.append(variant)

    return np.array(X), np.array(y)