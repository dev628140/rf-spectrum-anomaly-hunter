"use client";

import useWebSocket from "react-use-websocket";

function getWebSocketUrl() {
  const apiURL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  let wsURL = apiURL.replace(/^http/, "ws");
  if (!wsURL.endsWith("/ws/live")) {
    wsURL = wsURL.replace(/\/$/, "") + "/ws/live";
  }
  return wsURL;
}

export function useRFStream() {
  const wsURL = getWebSocketUrl();
  const { lastMessage } = useWebSocket(wsURL, {
    shouldReconnect: () => true,
  });

  let data = null;

  try {

    data =
      lastMessage
      ?
      JSON.parse(
        lastMessage.data
      )
      :
      null;

  } catch {

    data = null;
  }

  return data;
}