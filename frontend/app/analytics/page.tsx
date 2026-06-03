"use client";

import { AnalyticsCards } from "@/components/dashboard/analytics-cards";
import { useRFAnalytics } from "@/hooks/use-rf";
import { useHistoryMetrics } from "@/hooks/use-history";

export default function AnalyticsPage() {
  const analytics = useRFAnalytics();
  const historyMetrics = useHistoryMetrics();

  return (
    <AnalyticsCards
      analytics={analytics.data}
      historyMetrics={historyMetrics.data}
    />
  );
}