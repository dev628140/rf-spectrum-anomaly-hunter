from edge.collector.rtl_capture import RTLCapture


capture = RTLCapture()

print("Connecting SDR...")
capture.connect()

print("Reading samples...")
samples = capture.read_samples()

print(samples.shape)
print(samples.dtype)

capture.disconnect()

print("Done.")