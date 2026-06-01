from backend.signal.fft_processor import FFTProcessor


class LiveWindowBuilder:
    def __init__(self, capture_service):
        self.capture_service = capture_service
        self.processor = FFTProcessor()

    def collect_window(self):
        """
        Collect 64 SDR reads and build model tensor.
        """

        iq_batches = []

        for i in range(64):
            samples = self.capture_service.read_samples()
            iq_batches.append(samples)

        tensor = self.processor.build_window(iq_batches)

        return tensor