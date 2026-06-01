import os
import time
import base64
import paho.mqtt.client as mqtt

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DATASET_PATH = os.path.join(BASE_DIR, "dataset", "anomaly")

BROKER = "broker.hivemq.com"
PORT = 1883
TOPIC = "rf/anomaly/detect"


client = mqtt.Client()
client.connect(BROKER, PORT, 60)


def send_images():

    files = os.listdir(DATASET_PATH)

    for file in files:

        file_path = os.path.join(DATASET_PATH, file)

        with open(file_path, "rb") as f:
            encoded = base64.b64encode(f.read()).decode()

        client.publish(TOPIC, encoded)

        print(f"Sent: {file}")

        time.sleep(2)


if __name__ == "__main__":
    send_images()