import numpy as np


class SimulationAdapter:
    def get_window(self):
        base = np.random.normal(
            loc=-95,
            scale=6,
            size=(64, 1025)
        ).astype(np.float32)

        if np.random.rand() > 0.9:
            burst = np.random.randint(200, 900)
            base[:, burst:burst + 20] += 45

        return base

    def shutdown(self):
        pass