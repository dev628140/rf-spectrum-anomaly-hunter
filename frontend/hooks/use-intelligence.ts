"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useExplanation() {
  return useQuery({
    queryKey: ["explanation"],
    queryFn: async () => {
      const res = await api.get("/api/intelligence/explain");
      return res.data;
    },
  });
}