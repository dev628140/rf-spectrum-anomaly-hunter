import json
import ssl

from backend.core.config import (
    MQTT_ENABLED,
    MQTT_BROKER,
    MQTT_PORT,
    MQTT_CLIENT_ID,
    MQTT_USERNAME,
    MQTT_PASSWORD
)

try:
    import paho.mqtt.client as mqtt
except ImportError:
    mqtt = None


class MQTTService:
    def __init__(self):
        self.enabled = MQTT_ENABLED
        self.client = None
        self.connected = False

        if not self.enabled:
            print("[INFO] MQTT disabled.")
            return

        if mqtt is None:
            print("[WARN] paho-mqtt not installed.")
            self.enabled = False
            return

        import random
        unique_client_id = f"{MQTT_CLIENT_ID}-{random.randint(10000, 99999)}"

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


        self.client.username_pw_set(
            MQTT_USERNAME,
            MQTT_PASSWORD
        )

        # Skip TLS configuration if we are connecting to localhost or if broker is localhost and port is 1883
        if MQTT_BROKER != "localhost" and MQTT_PORT != 1883:
            try:
                self.client.tls_set(
                    tls_version=ssl.PROTOCOL_TLS
                )
            except Exception as tls_err:
                print(f"[WARN] Failed to set TLS for MQTT: {tls_err}")


        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect

        try:
            print(
                f"[INFO] Connecting MQTT -> "
                f"{MQTT_BROKER}:{MQTT_PORT}"
            )

            self.client.connect(
                MQTT_BROKER,
                MQTT_PORT,
                60
            )

            self.client.loop_start()

        except Exception as e:
            print(
                f"[WARN] MQTT connection failed: {e}"
            )

            self.enabled = False

    def _on_connect(
        self,
        client,
        userdata,
        flags,
        rc
    ):
        if rc == 0:
            self.connected = True

            print(
                "[INFO] MQTT connected successfully."
            )

        else:
            print(
                f"[WARN] MQTT connect failed: {rc}"
            )

    def _on_disconnect(
        self,
        client,
        userdata,
        rc
    ):
        self.connected = False

        print(f"[WARN] MQTT disconnected with reason code: {rc}")

    def publish(
        self,
        topic,
        payload
    ):
        if not self.enabled:
            return

        if not self.connected:
            print(
                "[WARN] MQTT not connected."
            )
            return

        try:
            message = json.dumps(payload)

            self.client.publish(
                topic,
                message,
                qos=1
            )

            print(
                f"[MQTT] Published -> {topic}"
            )

        except Exception as e:
            print(
                f"[WARN] MQTT publish failed: {e}"
            )

    def shutdown(self):
        if self.client:
            self.client.loop_stop()
            self.client.disconnect()


