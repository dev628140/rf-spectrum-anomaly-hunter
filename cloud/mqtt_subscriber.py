import os
import sys

# FIX PATH ISSUE
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

import base64
import io
import paho.mqtt.client as mqtt
from PIL import Image
import torch
import torch.nn as nn
import torchvision.transforms as transforms

from ml.autoencoder import Autoencoder


# BASE PATH
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "models", "autoencoder.pth")


# LOAD MODEL
model = Autoencoder()
model.load_state_dict(torch.load(MODEL_PATH))
model.eval()

criterion = nn.MSELoss()

THRESHOLD = 0.00013267715353700534


transform = transforms.Compose([
    transforms.Grayscale(num_output_channels=1),
    transforms.Resize((64, 64)),
    transforms.ToTensor()
])


import sys

# Reconfigure stdout to use UTF-8 to prevent UnicodeEncodeError on Windows terminals when printing emojis
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

BROKER = "broker.hivemq.com"
PORT = 1883
TOPIC = "rf/anomaly/detect"


def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        print("Connected to MQTT broker successfully.")
        print(f"Subscribing to topic: {TOPIC}")
        client.subscribe(TOPIC)
    else:
        print(f"Connection failed with code: {rc}")


def on_message(client, userdata, msg):
    try:
        print("\n📡 Message received")

        # Decode image
        data = base64.b64decode(msg.payload)
        image = Image.open(io.BytesIO(data))

        image = transform(image)
        image = image.unsqueeze(0)

        # Run model
        with torch.no_grad():
            output = model(image)
            loss = criterion(output, image)

        score = loss.item()
        result = "ANOMALY" if score > THRESHOLD else "NORMAL"

        print(f"Result: {result} | Score: {score}")
    except Exception as e:
        print(f"Error processing received message: {e}")


# Initialize MQTT Client with v2.x and v1.x constructor compatibility
try:
    client = mqtt.Client(
        callback_api_version=mqtt.CallbackAPIVersion.VERSION1
    )
except AttributeError:
    client = mqtt.Client()

client.on_connect = on_connect
client.on_message = on_message

try:
    print(f"Connecting to broker: {BROKER}:{PORT}")
    client.connect(BROKER, PORT, 60)
    print("🚀 MQTT Subscriber Running...")
    client.loop_forever()
except Exception as e:
    print(f"Failed to start MQTT subscriber: {e}")