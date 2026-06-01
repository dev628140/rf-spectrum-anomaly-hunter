import numpy as np


class RTLCapture:
    def __init__(
        self,
        center_freq=433_920_000,
        sample_rate=2_048_000,
        gain="auto",
        samples_per_read=262144
    ):
        self.center_freq = center_freq
        self.sample_rate = sample_rate
        self.gain = gain
        self.samples_per_read = samples_per_read

        self.sdr = None

    def connect(self):
        try:
            from rtlsdr import RtlSdr
        except Exception as e:
            raise RuntimeError(
                f"RTL-SDR backend unavailable: {e}"
            )

        self.sdr = RtlSdr()

        self.sdr.center_freq = self.center_freq
        self.sdr.sample_rate = self.sample_rate
        self.sdr.gain = self.gain

    def read_samples(self):
        if self.sdr is None:
            raise RuntimeError(
                "SDR not connected."
            )

        samples = self.sdr.read_samples(
            self.samples_per_read
        )

        return np.array(samples)

    def disconnect(self):
        if self.sdr:
            self.sdr.close()
            self.sdr = None