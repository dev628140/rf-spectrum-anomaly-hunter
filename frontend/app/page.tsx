"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { RFSpectrum } from "@/components/dashboard/rf-spectrum";
import { RFWaterfall } from "@/components/dashboard/rf-waterfall";
import { ModelComparison } from "@/components/dashboard/model-comparison";
import { ExplanationPanel } from "@/components/dashboard/explanation-panel";
import { IncidentFeed } from "@/components/dashboard/incident-feed";
import { useIncidents } from "@/hooks/use-history";
import { useExplanation } from "@/hooks/use-intelligence";

export default function HomePage() {
  // Load real-time analytics queries
  const incidents = useIncidents();
  const explanation = useExplanation();

  return (
    <div className="flex min-h-screen bg-[#050816] text-white">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Panel */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Unified Header */}
        <Topbar />

        {/* Dashboard Content */}
        <div className="p-12 space-y-12 overflow-y-auto flex-1">
          
          {/* Telemetry Charts: FFT & Spectrogram Heatmap (Symmetric Height 680px) */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-stretch">
            <div className="min-w-0 flex flex-col h-[680px]">
              <RFSpectrum />
            </div>
            <div className="min-w-0 flex flex-col h-[680px]">
              <RFWaterfall />
            </div>
          </div>

          {/* AI Threat Context & Multi-Model Analysis (Symmetric Height 650px) */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-12 items-stretch">
            
            {/* Realtime Multi-Model Comparison Panel */}
            <div className="min-w-0 flex flex-col h-[650px]">
              <ModelComparison />
            </div>

            {/* AI Explanation reasoning */}
            <div className="min-w-0 flex flex-col h-[650px]">
              {explanation.data?.explanation ? (
                <ExplanationPanel explanation={explanation.data} />
              ) : (
                <div className="rounded-[2rem] border border-cyan-500/10 bg-[#07111f] p-12 flex-1 flex items-center justify-center h-full shadow-[0_0_50px_rgba(0,255,255,0.02)]">
                  <div className="text-center">
                    <p className="text-5xl font-black text-cyan-300 animate-pulse mb-4 font-mono tracking-widest">
                      ANALYZING...
                    </p>
                    <p className="text-2xl text-slate-300 font-semibold">
                      Waiting for threat reasoning details
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Incidents feed log */}
            <div className="min-w-0 flex flex-col h-[650px]">
              {incidents.data?.data ? (
                <IncidentFeed incidents={incidents.data} />
              ) : (
                <div className="rounded-[2rem] border border-cyan-500/10 bg-[#07111f] p-12 flex-1 flex items-center justify-center h-full shadow-[0_0_50px_rgba(0,255,255,0.02)]">
                  <div className="text-center">
                    <p className="text-5xl font-black text-cyan-300 animate-pulse mb-4 font-mono tracking-widest">
                      ACTIVE LINK
                    </p>
                    <p className="text-2xl text-slate-300 font-semibold">
                      Waiting for anomalous threat events
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}