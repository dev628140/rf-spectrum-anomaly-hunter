import json
import ssl
import collections
import numpy as np
import paho.mqtt.client as mqtt
from backend.core.config import (
    MQTT_BROKER,
    MQTT_PORT,
    MQTT_CLIENT_ID,
    MQTT_USERNAME,
    MQTT_PASSWORD
)

class MQTTReceiverAdapter:
    def __init__(self):
        # Rolling buffer storing up to 64 historical sweeps
        self.buffer = collections.deque(maxlen=64)
        self.client = None
        self.connected = False
        self.latest_max_dbm = -100.0
        
        import random
        unique_client_id = f"{MQTT_CLIENT_ID}-recv-{random.randint(10000, 99999)}"
        
        try:
            # Try paho-mqtt v2.x constructor first
            self.client = mqtt.Client(
                callback_api_version=mqtt.CallbackAPIVersion.VERSION1,
                client_id=unique_client_id
            )
        except AttributeError:
            # Fall back to v1.x constructor
            self.client = mqtt.Client(
                client_id=unique_client_id
            )
            
        if MQTT_USERNAME and MQTT_PASSWORD:
            self.client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
            
        # Configure SSL/TLS encryption for cloud-based brokers (e.g. HiveMQ)
        if MQTT_BROKER != "localhost" and MQTT_PORT != 1883:
            try:
                self.client.tls_set(tls_version=ssl.PROTOCOL_TLS)
            except Exception as tls_err:
                print(f"[WARN] Failed to set TLS for MQTT Receiver: {tls_err}")
                
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect
        self.client.on_message = self._on_message
        
        try:
            print(f"[MQTT Receiver] Initiating handshake -> {MQTT_BROKER}:{MQTT_PORT}")
            self.client.connect(MQTT_BROKER, MQTT_PORT, 60)
            self.client.loop_start()
        except Exception as e:
            print(f"[ERROR] MQTT Receiver network connection failed: {e}")
            
    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            self.connected = True
            print("[MQTT Receiver] Successfully connected. Subscribing to topic: rf/telemetry")
            self.client.subscribe("rf/telemetry", qos=1)
        else:
            print(f"[MQTT Receiver] Broker handshake failed with code: {rc}")
            
    def _on_disconnect(self, client, userdata, rc):
        self.connected = False
        print(f"[MQTT Receiver] Connection severed. Reason code: {rc}")
        
    def _on_message(self, client, userdata, msg):
        try:
            payload = json.loads(msg.payload.decode("utf-8"))
            
            # Capture raw max dbm from the payload
            max_dbm = payload.get("max_dbm")
            if max_dbm is not None:
                self.latest_max_dbm = float(max_dbm)
                
            raw_spectrum = payload.get("raw_spectrum")
            if raw_spectrum:
                sweep = np.array(raw_spectrum, dtype=np.float32)
                
                # Clean invalid values (NaN / Inf) right at ingestion
                sweep = np.nan_to_num(sweep, nan=-100.0, posinf=-100.0, neginf=-100.0)
                
                # Automatically interpolate bin count to 1025 (matching ML model input shape)
                if len(sweep) != 1025:
                    xp = np.linspace(0, 1, len(sweep))
                    x = np.linspace(0, 1, 1025)
                    sweep = np.interp(x, xp, sweep).astype(np.float32)
                    
                self.buffer.append(sweep)
        except Exception as e:
            print(f"[MQTT Receiver] Failed to process incoming telemetry frame: {e}")
            
    def get_window(self):
        # Generate baseline fallback if the queue is not fully populated yet
        if len(self.buffer) < 64:
            missing = 64 - len(self.buffer)
            # Baseline normal thermal noise range between -105 and -95 dBm
            baseline = -100.0 + np.random.randn(missing, 1025) * 5.0
            
            # Overlay realistic mock signals (FM station bands)
            frequencies = np.linspace(88.0, 108.0, 1025)
            for freq_target, power_db in [(91.5, -45.0), (98.1, -35.0), (104.3, -50.0)]:
                idx = np.argmin(np.abs(frequencies - freq_target))
                for offset in range(-5, 6):
                    if 0 <= idx + offset < 1025:
                        attenuation = np.exp(-(offset**2) / 3.0)
                        baseline[:, idx + offset] += (power_db - baseline[:, idx + offset]) * attenuation
            
            if len(self.buffer) > 0:
                window = np.vstack([baseline, np.array(list(self.buffer))])
            else:
                window = baseline
        else:
            window = np.array(list(self.buffer))
            
        # Guarantee no NaNs or Infs leak to model execution
        window = np.nan_to_num(window, nan=-100.0, posinf=-100.0, neginf=-100.0)
            
        print(
            f"[MQTT-LIVE] Rolling Window Frame: "
            f"shape={window.shape} "
            f"min={window.min():.4f} "
            f"max={window.max():.4f}"
        )
        return window.astype(np.float32)
        
    def get_latest_max_dbm(self):
        return self.latest_max_dbm
        
    def shutdown(self):
        if self.client:
            print("[MQTT Receiver] Releasing active MQTT connection socket...")
            self.client.loop_stop()
            self.client.disconnect()
