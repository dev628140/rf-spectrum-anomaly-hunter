import numpy as np

from backend.signal.live_window_builder import LiveWindowBuilder


class FakeCapture:
    def read_samples(self):
        real = np.random.randn(2048)
        imag = np.random.randn(2048)
        return real + 1j * imag


capture = FakeCapture()

builder = LiveWindowBuilder(capture)

tensor = builder.collect_window()

print(tensor.shape)
print(tensor.dtype)
print(tensor.min(), tensor.max())