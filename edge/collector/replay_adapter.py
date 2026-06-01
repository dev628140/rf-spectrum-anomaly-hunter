import os
import random
import numpy as np


class ReplayAdapter:

    def __init__(self, dataset_root):
        self.dataset_root = dataset_root
        self.normal_dir = os.path.join(dataset_root, "normal")
        self.anomaly_dir = os.path.join(dataset_root, "anomaly")
        self.samples = []
        self.use_synthetic = False

        # Attempt to load from directory, catch FileNotFoundError gracefully
        try:
            if not os.path.exists(self.normal_dir) or not os.path.exists(self.anomaly_dir):
                raise FileNotFoundError("Replay directories do not exist")

            for f in os.listdir(self.normal_dir):
                if f.endswith(".npz"):
                    self.samples.append(os.path.join(self.normal_dir, f))

            for f in os.listdir(self.anomaly_dir):
                if f.endswith(".npz"):
                    self.samples.append(os.path.join(self.anomaly_dir, f))

            if len(self.samples) == 0:
                raise ValueError("No npz samples found in directory")

            random.shuffle(self.samples)
            self.index = 0
            print(f"[INFO] Loaded {len(self.samples)} replay samples")

        except Exception as e:
            print(f"[ReplayAdapter] Dataset load failed: {e}. Falling back to dynamic real-time synthetic RF window generator...")
            self.use_synthetic = True

    def get_window(self):
        if self.use_synthetic:
            # Baseline normal noise between -105 and -95 dBm
            window = -100.0 + np.random.randn(64, 1025) * 5.0

            # Add stable FM radio channels (baseline spectral peaks)
            frequencies = np.linspace(88.0, 108.0, 1025)
            for freq_target, power_db in [(91.5, -45.0), (98.1, -35.0), (104.3, -50.0)]:
                idx = np.argmin(np.abs(frequencies - freq_target))
                for offset in range(-5, 6):
                    if 0 <= idx + offset < 1025:
                        attenuation = np.exp(-(offset**2) / 3.0)
                        window[:, idx + offset] += (power_db - window[:, idx + offset]) * attenuation

            # Dynamic threat generation (15% chance of anomaly)
            is_anomaly = random.random() < 0.15
            if is_anomaly:
                threat_choice = random.choice(["jammer", "wideband", "burst"])
                if threat_choice == "jammer":
                    # Jammer at 97.4 MHz
                    idx = np.argmin(np.abs(frequencies - 97.4))
                    for offset in range(-3, 4):
                        if 0 <= idx + offset < 1025:
                            window[:, idx + offset] = -12.0 + np.random.randn(64) * 2.0
                elif threat_choice == "wideband":
                    # Wideband noise between 94.0 and 102.0 MHz
                    idx_start = np.argmin(np.abs(frequencies - 94.0))
                    idx_end = np.argmin(np.abs(frequencies - 102.0))
                    window[:, idx_start:idx_end] = -35.0 + np.random.randn(64, idx_end - idx_start) * 4.0
                elif threat_choice == "burst":
                    # Burst attack at 101.5 MHz on last 20 frames
                    idx = np.argmin(np.abs(frequencies - 101.5))
                    for offset in range(-4, 5):
                        if 0 <= idx + offset < 1025:
                            window[-20:, idx + offset] = -15.0 + np.random.randn(20) * 3.0

            print(
                f"[SYNTHETIC-REPLAY] "
                f"shape={window.shape} "
                f"min={window.min():.4f} "
                f"max={window.max():.4f}"
            )
            return window.astype(np.float32)

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