import subprocess
import json
import time
import ssl
import os
import math
import paho.mqtt.client as mqtt

# ==============================================================================
# HIVEMQ CLOUD CONFIGURATION (Matches Backend Settings)
# ==============================================================================
BROKER_IP = "4ae6790b1c6d420ba90577449bfdb323.s1.eu.hivemq.cloud"
BROKER_PORT = 8883
MQTT_USER = "rfadmin"
MQTT_PASS = "RfIntel@2026"
TOPIC = "rf/telemetry"

print(f"📡 Connecting to HiveMQ Cloud Broker at {BROKER_IP}:{BROKER_PORT}...", flush=True)

# Initialize MQTT Client
try:
    # Try paho-mqtt v2.x constructor first
    client = mqtt.Client(
        callback_api_version=mqtt.CallbackAPIVersion.VERSION1,
        client_id="remote-sdr-node"
    )
except AttributeError:
    # Fall back to v1.x constructor
    client = mqtt.Client(client_id="remote-sdr-node")

client.username_pw_set(MQTT_USER, MQTT_PASS)

# Set SSL/TLS context for secure HiveMQ Cloud connection (TLS 1.3 / SNI compliant)
try:
    # Explicitly check for standard Raspberry Pi root certificates path
    ca_certs_path = "/etc/ssl/certs/ca-certificates.crt"
    if not os.path.exists(ca_certs_path):
        ca_certs_path = None  # Fallback to Python system defaults
        
    client.tls_set(
        ca_certs=ca_certs_path,
        cert_reqs=ssl.CERT_REQUIRED,
        tls_version=ssl.PROTOCOL_TLS_CLIENT
    )
except Exception as e:
    print(f"[ERROR] Failed to set up TLS context: {e}", flush=True)
    exit(1)

# Status Callbacks
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("✅ Securely Connected to HiveMQ Broker! Starting Live Ingress...", flush=True)
    else:
        print(f"❌ Connection failed with code {rc}", flush=True)

def on_disconnect(client, userdata, rc):
    print(f"⚠️ Disconnected from broker. Code: {rc}", flush=True)

client.on_connect = on_connect
client.on_disconnect = on_disconnect

try:
    client.connect(BROKER_IP, BROKER_PORT, 60)
    client.loop_start()
except Exception as e:
    print(f"❌ Broker connection failed: {e}", flush=True)
    exit(1)

# ==============================================================================
# SDR ACQUISITION (Scanning 314.5 MHz to 315.5 MHz with 1kHz bin resolution)
# ==============================================================================
cmd = ["rtl_power", "-f", "314.5M:315.5M:1k", "-i", "1", "-"]

print("\n🚀 Initializing RTL-SDR front-end...", flush=True)
print(f"⚡ Command: {' '.join(cmd)}\n", flush=True)

try:
    # Spawn the rtl_power sub-process
    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True)
    
    # Read stdout line-by-line in real time, bypassing Python I/O buffering
    for line in iter(process.stdout.readline, ''):
        parts = line.strip().split(", ")
        
        # Valid data rows have index headers followed by dBm bins
        if len(parts) > 6:
            # Combine Date (parts[0]) and Time (parts[1]) for a valid parseable datetime
            timestamp = f"{parts[0]} {parts[1]}"
            
            # Extract and parse individual frequency bin decibel power levels (dBm)
            try:
                dbm_values = []
                for x in parts[6:]:
                    val_str = x.strip()
                    if val_str == "":
                        continue
                    val = float(val_str)
                    # Safe-guard: replace NaN / Inf with a baseline of -100.0 dBm
                    if math.isnan(val) or math.isinf(val):
                        val = -100.0
                    dbm_values.append(val)
            except ValueError:
                continue
                
            if not dbm_values:
                continue
            
            max_dbm = max(dbm_values)
            
            # Format JSON payload matching the backend's MQTT Ingestion Schema
            payload = {
                "timestamp": timestamp,
                "frequency": 315.0,
                "max_dbm": max_dbm,
                "raw_spectrum": dbm_values
            }
            
            # Publish payload over encrypted SSL link
            client.publish(TOPIC, json.dumps(payload), qos=1)
            
            # Interactive Console Feedback
            if max_dbm > -40.0:
                print(f"🚨 [ANOMALY DETECTED] Max: {max_dbm:.2f} dBm -> Transmitting to Cloud...", flush=True)
            else:
                print(f"📊 [Baseline Stream] Max: {max_dbm:.2f} dBm -> Transmitting...", flush=True)

except KeyboardInterrupt:
    print("\n🛑 Shutting down streamer...", flush=True)
finally:
    try:
        process.terminate()
    except NameError:
        pass
    client.loop_stop()
    client.disconnect()
    print("🔌 Secure connection closed.", flush=True)
