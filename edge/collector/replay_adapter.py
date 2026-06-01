import os
import random
import numpy as np


class ReplayAdapter:

    def __init__(self, dataset_root):

        self.dataset_root = dataset_root

        self.normal_dir = os.path.join(
            dataset_root,
            "normal"
        )

        self.anomaly_dir = os.path.join(
            dataset_root,
            "anomaly"
        )

        self.samples = []

        """
        LOAD NORMAL SAMPLES
        """

        for f in os.listdir(
            self.normal_dir
        ):

            if f.endswith(".npz"):

                self.samples.append(
                    os.path.join(
                        self.normal_dir,
                        f
                    )
                )

        """
        LOAD ANOMALY SAMPLES
        """

        for f in os.listdir(
            self.anomaly_dir
        ):

            if f.endswith(".npz"):

                self.samples.append(
                    os.path.join(
                        self.anomaly_dir,
                        f
                    )
                )

        random.shuffle(
            self.samples
        )

        self.index = 0

        print(
            f"[INFO] Loaded "
            f"{len(self.samples)} "
            f"replay samples"
        )

    def get_window(self):

        """
        LOOP DATASET
        """

        if self.index >= len(
            self.samples
        ):

            random.shuffle(
                self.samples
            )

            self.index = 0

        sample_path = self.samples[
            self.index
        ]

        self.index += 1

        """
        LOAD NPZ SAMPLE
        """

        data = np.load(
            sample_path
        )

        """
        EXTRACT RF WINDOW
        """

        window = data[
            "rf_window"
        ]

        """
        FORCE FLOAT32
        """

        window = np.asarray(
            window,
            dtype=np.float32
        )

        """
        CLEAN INVALID VALUES
        """

        window = np.nan_to_num(
            window,
            nan=0.0,
            posinf=0.0,
            neginf=0.0
        )

        print(
            f"[REPLAY] "
            f"shape={window.shape} "
            f"min={window.min():.4f} "
            f"max={window.max():.4f}"
        )

        return window

    def shutdown(self):

        pass