"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { AnalyticsCards } from "@/components/dashboard/analytics-cards";
import { useRFAnalytics } from "@/hooks/use-rf";
import { useHistoryMetrics } from "@/hooks/use-history";

export default function AnalyticsPage() {
  const analytics = useRFAnalytics();
  const historyMetrics = useHistoryMetrics();

  return (
    <div className="flex min-h-screen bg-[#050816] text-white">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Topbar />

        <div className="p-12 space-y-12 overflow-y-auto flex-1">
          <AnalyticsCards
            analytics={analytics.data}
            historyMetrics={historyMetrics.data}
          />
        </div>
      </main>
    </div>
  );
}