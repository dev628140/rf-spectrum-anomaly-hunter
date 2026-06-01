from edge.collector.rtl_adapter import RTLAdapter


adapter = RTLAdapter()

window = adapter.get_window()

print(window.shape)

adapter.shutdown()