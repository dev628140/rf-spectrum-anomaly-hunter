"use client";

import { useEffect } from "react";
import { useRFStore } from "@/store/rf-store";
import { useAuthStore } from "@/store/auth-store";

export function useLiveRF() {
  const setRFData = useRFStore((state) => state.setRFData);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;
    let ws: WebSocket | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    let isCleanup = false;

    function getWebSocketUrl() {
      const apiURL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      let wsURL = apiURL.replace(/^http/, "ws");
      if (!wsURL.endsWith("/ws/live")) {
        wsURL = wsURL.replace(/\/$/, "") + "/ws/live";
      }
      return wsURL;
    }

    function connect() {
      if (isCleanup) return;

      const wsURL = getWebSocketUrl();
      console.log(`WEBSOCKET: Connecting to ${wsURL}...`);
      
      try {
        ws = new WebSocket(wsURL);

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
  }, [setRFData, isAuthenticated]);
}