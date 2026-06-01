from edge.collector.rtl_capture import RTLCapture
from backend.signal.live_window_builder import LiveWindowBuilder


class RTLAdapter:
    def __init__(self):
        self.capture = RTLCapture()
        self.capture.connect()

        self.builder = LiveWindowBuilder(
            self.capture
        )

    def get_window(self):
        """
        Return model-ready RF tensor.
        """

        return self.builder.collect_window()

    def shutdown(self):
        self.capture.disconnect()