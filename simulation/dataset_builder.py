import os

from rf_signal_generator import RFSignalGenerator
from spectrogram_generator import SpectrogramGenerator
from image_saver import save_spectrogram_image


# 🔥 FIXED: Absolute project root path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

NORMAL_DIR = os.path.join(BASE_DIR, "dataset", "normal")
ANOMALY_DIR = os.path.join(BASE_DIR, "dataset", "anomaly")


# Create directories safely
os.makedirs(NORMAL_DIR, exist_ok=True)
os.makedirs(ANOMALY_DIR, exist_ok=True)


generator = RFSignalGenerator()
spectrogram = SpectrogramGenerator()


def generate_dataset(samples=1000):

    print("🚀 Generating NORMAL samples...\n")

    for i in range(samples):

        signal = generator.generate_normal_signal()

        spec = spectrogram.generate(signal)

        filename = os.path.join(NORMAL_DIR, f"normal_{i}.png")

        save_spectrogram_image(spec, filename)

        if i % 100 == 0:
            print(f"[NORMAL] Saved {i}/{samples}")


    print("\n🚀 Generating ANOMALY samples...\n")

    anomaly_samples = int(samples * 0.2)

    for i in range(anomaly_samples):

        signal = generator.generate_anomaly_signal()

        spec = spectrogram.generate(signal)

        filename = os.path.join(ANOMALY_DIR, f"anomaly_{i}.png")

        save_spectrogram_image(spec, filename)

        if i % 50 == 0:
            print(f"[ANOMALY] Saved {i}/{anomaly_samples}")


    print("\n✅ Dataset generation completed.")


if __name__ == "__main__":

    generate_dataset(5000)