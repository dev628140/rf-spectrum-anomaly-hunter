"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useRFCurrent() {
  return useQuery({
    queryKey: ["rf-current"],
    queryFn: async () => {
      const res = await api.get("/api/rf/current");
      return res.data;
    },
    refetchInterval: 1500,
  });
}

export function useRFHistory() {
  return useQuery({
    queryKey: ["rf-history"],
    queryFn: async () => {
      const res = await api.get("/api/rf/history");
      return res.data;
    },
    refetchInterval: 2000,
  });
}

export function useRFAnalytics() {
  return useQuery({
    queryKey: ["rf-analytics"],
    queryFn: async () => {
      const res = await api.get("/api/rf/analytics");
      return res.data;
    },
    refetchInterval: 3000,
  });
}

export function useRFReconstruction() {
  return useQuery({
    queryKey: ["rf-reconstruction"],
    queryFn: async () => {
      const res = await api.get("/api/rf/reconstruction");
      return res.data;
    },
    refetchInterval: 2000,
  });
}

export function useRFErrorMap() {
  return useQuery({
    queryKey: ["rf-error-map"],
    queryFn: async () => {
      const res = await api.get("/api/rf/error");
      return res.data;
    },
    refetchInterval: 2000,
  });
}

export function useRFHotspots() {
  return useQuery({
    queryKey: ["rf-hotspots"],
    queryFn: async () => {
      const res = await api.get("/api/rf/hotspots");
      return res.data;
    },
    refetchInterval: 2000,
  });
}

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const res = await api.get("/api/health");
      return res.data;
    },
    refetchInterval: 2000,
  });
}