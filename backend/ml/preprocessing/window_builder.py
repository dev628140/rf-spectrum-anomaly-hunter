import numpy as np
import pandas as pd


WINDOW_FRAMES = 64
TARGET_BINS = 1025


def parse_csv(csv_path):
    try:
        df = pd.read_csv(csv_path, header=None)

        if len(df) < WINDOW_FRAMES:
            return None

        power = df.iloc[:, 6:]
        power = power.apply(
            pd.to_numeric,
            errors="coerce"
        )

        power = power.fillna(-120.0)

        matrix = power.values.astype(np.float32)

        if matrix.shape[1] > TARGET_BINS:
            matrix = matrix[:, :TARGET_BINS]

        elif matrix.shape[1] < TARGET_BINS:
            pad = TARGET_BINS - matrix.shape[1]

            matrix = np.pad(
                matrix,
                ((0, 0), (0, pad)),
                constant_values=-120.0
            )

        return matrix[-WINDOW_FRAMES:]

    except:
        return None