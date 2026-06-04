from backend.core.config import MODE, REPLAY_DATASET_PATH
from edge.collector.simulation_adapter import SimulationAdapter
from edge.collector.replay_adapter import ReplayAdapter
from edge.collector.rtl_adapter import RTLAdapter


def get_adapter():
    if MODE == "simulation":
        return SimulationAdapter()

    elif MODE == "replay":
        return ReplayAdapter(REPLAY_DATASET_PATH)

    elif MODE == "mqtt_live":
        try:
            from edge.collector.mqtt_receiver_adapter import MQTTReceiverAdapter
            return MQTTReceiverAdapter()
        except Exception as e:
            print(f"[WARN] MQTT receiver adapter unavailable: {e}")
            print("[WARN] Falling back to simulation mode.")
            return SimulationAdapter()

    elif MODE == "rtl_live":
        try:
            return RTLAdapter()

        except Exception as e:
            print(
                f"[WARN] RTL adapter unavailable: {e}"
            )
            print(
                "[WARN] Falling back to simulation mode."
            )

            return SimulationAdapter()

    raise ValueError(f"Unsupported RF_MODE: {MODE}")