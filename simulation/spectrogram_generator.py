import numpy as np
from scipy.signal import spectrogram


class SpectrogramGenerator:

    def __init__(self, sample_rate=2.4e6):

        self.sample_rate = sample_rate

    def generate(self, signal):

        frequencies, times, Sxx = spectrogram(
            signal,
            fs=self.sample_rate,
            nperseg=1024,
            noverlap=512
        )

        Sxx = 10 * np.log10(Sxx + 1e-10)

        return Sxx