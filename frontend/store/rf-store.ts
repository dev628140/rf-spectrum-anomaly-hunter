"use client";

import { create } from "zustand";

type SpectrumPoint = {
  frequency: number;
  power: number;
};

type RFPayload = {
  signal: {
    spectrum: SpectrumPoint[];
    waterfall?: number[][]; // Dynamic client-side rolling spectrogram history
    metrics: {
      mean_power: number;
      peak_power: number;
      occupancy: number;
      dynamic_range: number;
      dominant_frequency?: number;
      mqtt_max_dbm?: number;
    };
  };
  status: {
    state: string;
    active_model?: string;
    score?: number;
    threshold?: number;
    timestamp?: string;
    model_scores?: Record<
      string,
      {
        status: string;
        score: number;
        latency: number;
        timestamp: string;
        threat_type: string;
      }
    >;
  };
};

type RFState = {
  rf: RFPayload;
  setRFData: (payload: RFPayload) => void;
};

export const useRFStore = create<RFState>((set) => ({
  rf: {
    signal: {
      spectrum: [],
      waterfall: [],
      metrics: {
        mean_power: 0,
        peak_power: 0,
        occupancy: 0,
        dynamic_range: 0,
        dominant_frequency: 98.0
      },
    },
    status: {
      state: "NORMAL",
      active_model: "AUTOENCODER",
      score: 0.0,
      threshold: 0.5,
    },
  },

  setRFData: (payload) => {
    set((state) => {
      // If the backend streams the waterfall history directly, prioritize it!
      if (payload.signal.waterfall && payload.signal.waterfall.length > 0) {
        return { rf: payload };
      }

      // Fallback: client-side rolling spectrogram history
      const latestPowers = payload.signal.spectrum.map((p) => p.power);
      if (latestPowers.length === 0) return { rf: state.rf };

      const currentWaterfall = state.rf.signal.waterfall || [];
      const newWaterfall = [...currentWaterfall, latestPowers].slice(-30);

      return {
        rf: {
          ...payload,
          signal: {
            ...payload.signal,
            waterfall: newWaterfall
          }
        }
      };
    });
  },
}));