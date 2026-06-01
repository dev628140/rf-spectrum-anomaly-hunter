"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useIncidents() {
  return useQuery({
    queryKey: ["incidents"],
    queryFn: async () => {
      const res = await api.get("/api/history/incidents");
      return res.data;
    },
    refetchInterval: 3000,
  });
}

export function useAlertLogs() {
  return useQuery({
    queryKey: ["alert-logs"],
    queryFn: async () => {
      const res = await api.get("/api/history/alerts");
      return res.data;
    },
    refetchInterval: 3000,
  });
}

export function useHistoryMetrics() {
  return useQuery({
    queryKey: ["history-metrics"],
    queryFn: async () => {
      const res = await api.get("/api/history/metrics");
      return res.data;
    },
    refetchInterval: 3000,
  });
}

export function useModelSwitches() {
  return useQuery({
    queryKey: ["model-switches"],
    queryFn: async () => {
      const res = await api.get("/api/history/model-switches");
      return res.data;
    },
    refetchInterval: 3000,
  });
}