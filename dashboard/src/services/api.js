const BASE = "http://127.0.0.1:8000";

export async function fetchLiveState() {
  const res = await fetch(`${BASE}/api/state`);
  return await res.json();
}

export async function fetchEvents() {
  const res = await fetch(`${BASE}/api/events`);
  return await res.json();
}

export async function fetchAnalytics() {
  const res = await fetch(`${BASE}/api/analytics`);
  return await res.json();
}

export async function fetchIntelligence() {
  const res = await fetch(`${BASE}/api/intelligence`);
  return await res.json();
}

export async function fetchTelemetry() {
  const res = await fetch(`${BASE}/api/telemetry`);
  return await res.json();
}

export function explainabilityImageUrl() {
  return `${BASE}/static/live_runtime/latest_explainability.png?t=${Date.now()}`;
}