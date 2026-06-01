import os
from dotenv import load_dotenv
load_dotenv()

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(os.path.abspath(__file__))
    )
)

LIVE_DIR = os.path.join(BASE_DIR, "live_runtime")

STATE_PATH = os.path.join(LIVE_DIR, "live_state.json")
EVENT_PATH = os.path.join(LIVE_DIR, "recent_events.log")
RF_STATE_PATH = os.path.join(LIVE_DIR, "rf_state.json")
RF_HISTORY_PATH = os.path.join(LIVE_DIR, "rf_history.json")


MODE = os.getenv("RF_MODE", "simulation")

POLL_INTERVAL_SECONDS = int(
    os.getenv("RF_POLL_INTERVAL", "1")
)

REPLAY_DATASET_PATH = os.getenv(
    "RF_REPLAY_DATASET",
    os.path.join(BASE_DIR, "real_rf_dataset", "processed")
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "final_rf_autoencoder.pth"
)

THRESHOLD_PATH = os.path.join(
    BASE_DIR,
    "models",
    "final_rf_threshold.txt"
)

MQTT_ENABLED = os.getenv(
    "MQTT_ENABLED",
    "true"
).lower() == "true"

MQTT_BROKER = os.getenv(
    "MQTT_BROKER",
    "localhost"
)

MQTT_PORT = int(
    os.getenv(
        "MQTT_PORT",
        "1883"
    )
)

MQTT_CLIENT_ID = os.getenv(
    "MQTT_CLIENT_ID",
    "rf-spectrum-hunter"
)

MQTT_USERNAME = os.getenv(
    "MQTT_USERNAME",
    ""
)

MQTT_PASSWORD = os.getenv(
    "MQTT_PASSWORD",
    ""
)

API_HOST = os.getenv(
    "API_HOST",
    "127.0.0.1"
)

API_PORT = int(
    os.getenv("API_PORT", "8000")
)

HEALTH_PATH = os.path.join(
    LIVE_DIR,
    "health_state.json"
)
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
ALERT_EMAIL_TO = os.getenv("ALERT_EMAIL_TO", "")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")
WEBHOOK_ALERT_URL = os.getenv("WEBHOOK_ALERT_URL", "")