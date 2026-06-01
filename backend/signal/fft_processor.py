import numpy as np


class FFTProcessor:
    def __init__(
        self,
        fft_size=2048,
        target_rows=64,
        target_cols=1025
    ):
        self.fft_size = fft_size
        self.target_rows = target_rows
        self.target_cols = target_cols

    def iq_to_psd(self, iq_samples):
        """
        Convert complex IQ -> PSD in dB.
        """

        fft = np.fft.fft(iq_samples, n=self.fft_size)

        power = np.abs(fft) ** 2

        positive_half = power[:self.target_cols]

        power_db = 10 * np.log10(positive_half + 1e-12)

        return power_db.astype(np.float32)

    def build_window(self, iq_batches):
        """
        Build model-ready RF tensor.
        """

        if len(iq_batches) < self.target_rows:
            raise RuntimeError(
                "Need at least 64 IQ batches."
            )

        frames = []

        for iq in iq_batches[:self.target_rows]:
            psd = self.iq_to_psd(iq)
            frames.append(psd)

        tensor = np.array(frames, dtype=np.float32)

        if tensor.shape != (64, 1025):
            raise RuntimeError(
                f"Shape mismatch: {tensor.shape}"
            )

        return tensor