from tracemalloc import start

import numpy as np


class RFSignalGenerator:

    def __init__(self, sample_rate=2.4e6, duration=0.01):

        self.sample_rate = sample_rate
        self.duration = duration
        self.t = np.arange(0, duration, 1/sample_rate)

    def generate_normal_signal(self):

        frequency = np.random.uniform(10000, 50000)

        signal = np.exp(2j * np.pi * frequency * self.t)

        noise = 0.1 * (
            np.random.randn(len(self.t)) +
            1j * np.random.randn(len(self.t))
        )

        return signal + noise

    def generate_anomaly_signal(self):

        import numpy as np

    # Time axis
        t = np.arange(0, 0.01, 1 / 2.4e6)

    # Base normal signal
        signal = np.exp(2j * np.pi * 20000 * t)

    # 🔥 Localized anomaly burst
        burst_length = 200

        start = np.random.randint(2000, len(t) - burst_length - 1)
        end = start + burst_length

        anomaly = 8 * np.exp(2j * np.pi * 150000 * t[:burst_length])

    # Inject anomaly
        signal[start:end] += anomaly

    # Add noise
        noise = 0.2 * (np.random.randn(len(t)) + 1j * np.random.randn(len(t)))

        return signal + noise
    