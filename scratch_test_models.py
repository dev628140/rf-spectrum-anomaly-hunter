import os
import sys
import numpy as np

# Ensure project root is in path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from backend.services.model_registry import ModelRegistry

def main():
    print("[TEST] Loading all models...")
    registry = ModelRegistry()
    print("[TEST] Models loaded successfully:", registry.available_models())
    
    # 1. Create a clean normal window (explicit float32 precision)
    normal_window = (-80 + np.random.randn(64, 1025) * 2).astype(np.float32)
    
    # 2. Create an anomalous window (burst/interference spike, explicit float32 precision)
    anomaly_window = (-80 + np.random.randn(64, 1025) * 2).astype(np.float32)
    anomaly_window[:, 500:520] += 45.0  # Add a powerful anomaly spike
    
    print("\n--- RESULTS ON NORMAL SPECTRUM ---")
    normal_res = registry.predict_all(normal_window)
    for model_name, res in normal_res.items():
        print(f"Model: {model_name:<15} | Status: {res['status']:<8} | Anomaly Score: {res['score']:.8f}")
        
    print("\n--- RESULTS ON ANOMALOUS SPECTRUM (SPIKE DETECTED) ---")
    anomaly_res = registry.predict_all(anomaly_window)
    for model_name, res in anomaly_res.items():
        print(f"Model: {model_name:<15} | Status: {res['status']:<8} | Anomaly Score: {res['score']:.8f}")

if __name__ == "__main__":
    main()
