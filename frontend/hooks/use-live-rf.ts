"use client";

import { useEffect } from "react";
import { useRFStore } from "@/store/rf-store";

export function useLiveRF() {
  const setRFData = useRFStore((state) => state.setRFData);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    let isCleanup = false;

    function connect() {
      if (isCleanup) return;

      console.log("WEBSOCKET: Connecting to ws://127.0.0.1:8000/ws/live...");
      
      try {
        ws = new WebSocket("ws://127.0.0.1:8000/ws/live");

        ws.onopen = () => {
          console.log("WEBSOCKET: Connected successfully.");
        };

        ws.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            setRFData(parsed);
          } catch (err) {
            console.error("WEBSOCKET: Parse error:", err);
          }
        };

        ws.onerror = (error) => {
          // Log a clean warning rather than a generic error event
          console.warn("WEBSOCKET: Connection error. Re-establishing link...");
        };

        ws.onclose = () => {
          console.log("WEBSOCKET: Connection closed.");
          if (!isCleanup) {
            // Auto-reconnect retry interval of 2.5 seconds
            timeoutId = setTimeout(connect, 2500);
          }
        };
      } catch (wsErr) {
        console.error("WEBSOCKET: Setup error:", wsErr);
        if (!isCleanup) {
          timeoutId = setTimeout(connect, 2500);
        }
      }
    }

    connect();

    return () => {
      isCleanup = true;
      if (ws) ws.close();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [setRFData]);
}