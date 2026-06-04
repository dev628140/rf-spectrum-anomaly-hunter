"use client";
 
import { RFSpectrum } from "@/components/dashboard/rf-spectrum";
import { RFWaterfall } from "@/components/dashboard/rf-waterfall";
import { ModelComparison } from "@/components/dashboard/model-comparison";
import { ExplanationPanel } from "@/components/dashboard/explanation-panel";
import { IncidentFeed } from "@/components/dashboard/incident-feed";
import { useIncidents } from "@/hooks/use-history";
import { useExplanation } from "@/hooks/use-intelligence";
import { useAuthStore, hasFeatureAccess } from "@/store/auth-store";
import { RestrictedOverlay } from "@/components/restricted-overlay";

export default function HomePage() {
  const { user } = useAuthStore();
  const hasAccess = hasFeatureAccess(user, "live");
  
  // Load real-time analytics queries
  const incidents = useIncidents();
  const explanation = useExplanation();
 
  return (
    <div className="relative min-h-[calc(100vh-120px)] w-full">
      {!hasAccess && <RestrictedOverlay message="Live RF telemetry monitoring requires specific clearance." />}
      <div className="space-y-6">
      {/* Telemetry Charts: FFT & Spectrogram Heatmap (Symmetric Height 460px) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="min-w-0 flex flex-col h-[460px]">
          <RFSpectrum />
        </div>
        <div className="min-w-0 flex flex-col h-[460px]">
          <RFWaterfall />
        </div>
      </div>

      {/* AI Threat Context & Multi-Model Analysis (Symmetric Height 420px) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Realtime Multi-Model Comparison Panel */}
        <div className="min-w-0 flex flex-col h-[420px]">
          <ModelComparison />
        </div>

        {/* AI Explanation reasoning */}
        <div className="min-w-0 flex flex-col h-[420px]">
          {explanation.data?.explanation ? (
            <ExplanationPanel explanation={explanation.data} />
          ) : (
            <div className="rounded-[1.5rem] border border-cyan-500/10 bg-[#07111f] p-6 flex-1 flex items-center justify-center h-full shadow-[0_0_50px_rgba(0,255,255,0.02)]">
              <div className="text-center">
                <p className="text-2xl font-black text-cyan-300 animate-pulse mb-2 font-mono tracking-widest">
                  ANALYZING...
                </p>
                <p className="text-sm text-slate-300 font-semibold">
                  Waiting for threat reasoning details
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Incidents feed log */}
        <div className="min-w-0 flex flex-col h-[420px]">
          {incidents.data?.data ? (
            <IncidentFeed incidents={incidents.data} />
          ) : (
            <div className="rounded-[1.5rem] border border-cyan-500/10 bg-[#07111f] p-6 flex-1 flex items-center justify-center h-full shadow-[0_0_50px_rgba(0,255,255,0.02)]">
              <div className="text-center">
                <p className="text-2xl font-black text-cyan-300 animate-pulse mb-2 font-mono tracking-widest">
                  ACTIVE LINK
                </p>
                <p className="text-sm text-slate-300 font-semibold">
                  Waiting for anomalous threat events
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  </div>
);
}