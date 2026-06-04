import os
import time
import base64
import paho.mqtt.client as mqtt

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DATASET_PATH = os.path.join(BASE_DIR, "dataset", "anomaly")

BROKER = "broker.hivemq.com"
PORT = 1883
TOPIC = "rf/anomaly/detect"


# Initialize MQTT Client with constructor compatibility
try:
    client = mqtt.Client(
        callback_api_version=mqtt.CallbackAPIVersion.VERSION1
    )
except AttributeError:
    client = mqtt.Client()

client.connect(BROKER, PORT, 60)
client.loop_start()  # Start background thread to service connection


def send_images():

    files = os.listdir(DATASET_PATH)

    for file in files:

        file_path = os.path.join(DATASET_PATH, file)

        with open(file_path, "rb") as f:
            encoded = base64.b64encode(f.read()).decode()

        info = client.publish(TOPIC, encoded)
        info.wait_for_publish()  # Wait until transmission completes

        print(f"Sent: {file}")

        time.sleep(2)


if __name__ == "__main__":
    try:
        send_images()
    finally:
        client.loop_stop()
        client.disconnect()