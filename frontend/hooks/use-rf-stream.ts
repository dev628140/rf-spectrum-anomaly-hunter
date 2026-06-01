"use client";

import useWebSocket
from "react-use-websocket";

const WS_URL =
  "ws://127.0.0.1:8000/ws/live";

export function useRFStream() {

  const {
    lastMessage
  } = useWebSocket(
    WS_URL,
    {
      shouldReconnect:
        () => true
    }
  );

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