"use client";
 
import { AnalyticsCards } from "@/components/dashboard/analytics-cards";
import { useRFAnalytics } from "@/hooks/use-rf";
import { useHistoryMetrics } from "@/hooks/use-history";
import { useAuthStore, hasFeatureAccess } from "@/store/auth-store";
import { RestrictedOverlay } from "@/components/restricted-overlay";

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const hasAccess = hasFeatureAccess(user, "analytics");
  const analytics = useRFAnalytics();
  const historyMetrics = useHistoryMetrics();

  return (
    <div className="relative min-h-[calc(100vh-120px)] w-full">
      {!hasAccess && <RestrictedOverlay message="Access to RF analytics console requires specific clearance." />}
      <AnalyticsCards
        analytics={analytics.data}
        historyMetrics={historyMetrics.data}
      />
    </div>
  );
}