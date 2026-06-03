"use client";

import { useState, useMemo } from "react";
import { useIncidents } from "@/hooks/use-history";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  Clock, 
  Filter, 
  ShieldAlert, 
  CheckCircle, 
  Sparkles,
  ArrowRight,
  TrendingUp,
  Skull
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

export default function AlertsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const incidentsQuery = useIncidents();
  const rawIncidents = incidentsQuery.data?.data || [];

  const [filterSeverity, setFilterSeverity] = useState<"ALL" | "CRITICAL" | "HIGH" | "MEDIUM">("ALL");
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [resolvedMap, setResolvedMap] = useState<Record<string, boolean>>({});

  const filteredIncidents = useMemo(() => {
    let list = rawIncidents;
    if (filterSeverity !== "ALL") {
      list = rawIncidents.filter((inc: any) => inc.severity?.toUpperCase() === filterSeverity);
    }
    return list;
  }, [rawIncidents, filterSeverity]);

  const activeIncident = filteredIncidents[selectedIdx] || filteredIncidents[0] || null;

  const handleResolve = async (id: string) => {
    setResolvedMap((prev) => ({ ...prev, [id]: true }));
    try {
      await api.post(`/api/history/incidents/${id}/resolve`);
      incidentsQuery.refetch();
    } catch (err) {
      console.error("Failed to mark alert as resolved in DB:", err);
    }
  };

  // Helper for severity levels
  const getSeverityStyle = (severity: string) => {
    const s = severity?.toUpperCase();
    if (s === "CRITICAL") return { text: "text-red-400", border: "border-red-500/20", bg: "bg-red-500/5", glow: "shadow-[0_0_15px_rgba(239,68,68,0.08)]", badge: "bg-red-500/10 border-red-500/30 text-red-400" };
    if (s === "HIGH") return { text: "text-orange-400", border: "border-orange-500/20", bg: "bg-orange-500/5", glow: "shadow-[0_0_15px_rgba(249,115,22,0.08)]", badge: "bg-orange-500/10 border-orange-500/30 text-orange-400" };
    if (s === "MEDIUM") return { text: "text-yellow-400", border: "border-yellow-500/20", bg: "bg-yellow-500/5", glow: "shadow-[0_0_15px_rgba(234,179,8,0.08)]", badge: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400" };
    return { text: "text-green-400", border: "border-green-500/20", bg: "bg-green-500/5", glow: "shadow-[0_0_15px_rgba(34,197,94,0.05)]", badge: "bg-green-500/10 border-green-500/20 text-green-400" };
  };

  // Dynamic counts
  const criticalCount = rawIncidents.filter((i: any) => i.severity?.toUpperCase() === "CRITICAL").length;
  const highCount = rawIncidents.filter((i: any) => i.severity?.toUpperCase() === "HIGH").length;
  const activeCount = rawIncidents.length - Object.keys(resolvedMap).length;

  return (
    <>
          
          {/* Dashboard Telemetry Counters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 border-cyan-500/10 bg-[#07111f] rounded-xl flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-xs font-bold font-mono">TOTAL DETECTED</span>
                <div className="text-2xl font-black text-white mt-0.5 font-mono">{rawIncidents.length}</div>
              </div>
              <ShieldAlert className="h-8 w-8 text-cyan-400/40" />
            </Card>

            <Card className="p-4 border-cyan-500/10 bg-[#07111f] rounded-xl flex items-center justify-between">
              <div>
                <span className="text-red-400 text-xs font-bold font-mono">CRITICAL THREATS</span>
                <div className="text-2xl font-black text-red-400 mt-0.5 font-mono">{criticalCount}</div>
              </div>
              <Skull className="h-8 w-8 text-red-500/30" />
            </Card>

            <Card className="p-4 border-cyan-500/10 bg-[#07111f] rounded-xl flex items-center justify-between">
              <div>
                <span className="text-orange-400 text-xs font-bold font-mono">HIGH RISK EVENTS</span>
                <div className="text-2xl font-black text-orange-400 mt-0.5 font-mono">{highCount}</div>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500/30" />
            </Card>

            <Card className="p-4 border-cyan-500/10 bg-[#07111f] rounded-xl flex items-center justify-between">
              <div>
                <span className="text-green-400 text-xs font-bold font-mono">ACTIVE SECURE LOOPS</span>
                <div className="text-2xl font-black text-green-400 mt-0.5 font-mono">
                  {activeCount > 0 ? activeCount : "SECURE"}
                </div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500/30" />
            </Card>
          </div>

          {/* Incident Command Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Left Column: Filters and Feed Queue (Spans 2 Columns on desktop) */}
            <div className="xl:col-span-2 space-y-6 flex flex-col justify-between h-[580px]">
              
              {/* Filter Panel */}
              <Card className="p-5 border-cyan-500/10 bg-[#07111f] rounded-[1.5rem] shrink-0">
                <CardHeader className="p-0 mb-4 flex flex-row items-center gap-2">
                  <Filter className="h-5 w-5 text-cyan-300" />
                  <CardTitle className="text-base font-bold">Inference Filters</CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex flex-wrap gap-2">
                  {(["ALL", "CRITICAL", "HIGH", "MEDIUM"] as const).map((sev) => (
                    <button
                      key={sev}
                      onClick={() => {
                        setFilterSeverity(sev);
                        setSelectedIdx(0);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        filterSeverity === sev
                          ? "bg-cyan-500 text-black border-cyan-400 shadow-md"
                          : "bg-black/40 border-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Incident Feed List Card */}
              <Card className="p-5 border-cyan-500/10 bg-[#07111f] rounded-[1.5rem] flex-1 flex flex-col min-h-0">
                <CardHeader className="p-0 mb-4 flex flex-row items-center gap-2 shrink-0">
                  <AlertTriangle className="h-5 w-5 text-cyan-300 animate-pulse" />
                  <CardTitle className="text-base font-bold">Threat Feed Queue</CardTitle>
                </CardHeader>
                
                <CardContent className="p-0 flex-1 overflow-y-auto space-y-3 pr-1.5 custom-scrollbar">
                  {filteredIncidents.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 font-bold text-sm">
                      No matching threat incidents recorded.
                    </div>
                  ) : (
                    filteredIncidents.map((incident: any, idx: number) => {
                      const colors = getSeverityStyle(incident.severity);
                      const isSelected = activeIncident?.id === incident.id;
                      const isResolved = resolvedMap[incident.id] || incident.resolved;
                      const date = new Date(incident.timestamp);
                      const timeStr = isNaN(date.getTime())
                        ? incident.timestamp
                        : `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;

                      return (
                        <div
                          key={incident.id || idx}
                          onClick={() => setSelectedIdx(idx)}
                          className={`border rounded-xl p-3.5 transition-all duration-150 cursor-pointer flex flex-col gap-1.5 ${
                            isSelected
                              ? "border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.1)] bg-cyan-500/[0.03]"
                              : "border-white/5 bg-black/25 hover:border-cyan-500/20 hover:bg-white/[0.01]"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <span className={`inline-block h-2 w-2 rounded-full ${
                                isResolved ? "bg-green-400" : incident.severity === 'CRITICAL' ? 'bg-red-500 animate-pulse' : 'bg-orange-500'
                              }`} />
                              <span className={`text-[10px] font-black tracking-wider uppercase ${
                                isResolved ? "text-green-400" : colors.text
                              }`}>
                                {isResolved ? "RESOLVED" : incident.severity}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-slate-500 text-[10px] font-bold font-mono">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{timeStr}</span>
                            </div>
                          </div>

                          <div className="text-sm font-black text-white leading-tight">
                            {incident.threat_type?.replace("_", " ").toUpperCase() || "UNKNOWN TELEMETRY"}
                          </div>

                          <p className="text-slate-400 text-xs font-semibold leading-relaxed line-clamp-2">
                            {incident.summary}
                          </p>

                          <div className="flex justify-between items-center mt-1 pt-2 border-t border-white/5 text-[9px] text-slate-500 font-bold font-mono">
                            <div>SCORE: <span className="text-slate-300">{(incident.score || 0.0).toFixed(4)}</span></div>
                            <div>CONFIDENCE: <span className="text-slate-300">{(incident.confidence || 0.0).toFixed(1)}%</span></div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>

            </div>

            {/* Right Column: Selected Threat Detail Explorer */}
            <Card className="p-5 border-cyan-500/10 bg-[#07111f] rounded-[1.5rem] flex flex-col h-[580px] justify-between">
              <div>
                <CardHeader className="p-0 mb-4 shrink-0">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-cyan-300" />
                    Forensic Threat Analyst
                  </CardTitle>
                </CardHeader>
                
                {activeIncident ? (
                  <CardContent className="p-0 space-y-4 text-sm">
                    <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
                      <span className="text-slate-400 font-medium">Incident Status</span>
                      <span className={`px-2.5 py-0.5 rounded font-black text-xs border ${
                        (resolvedMap[activeIncident.id] || activeIncident.resolved)
                          ? "bg-green-500/10 border-green-500/30 text-green-400"
                          : "bg-red-500/10 border-red-500/30 text-red-400 animate-pulse"
                      }`}>
                        {(resolvedMap[activeIncident.id] || activeIncident.resolved) ? "RESOLVED" : "THREAT ACTIVE"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
                      <span className="text-slate-400 font-medium">Threat Classifier</span>
                      <span className="text-white font-bold font-mono">{activeIncident.threat_type?.toUpperCase()}</span>
                    </div>

                    <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
                      <span className="text-slate-400 font-medium">Neural confidence</span>
                      <span className="text-cyan-300 font-bold font-mono">{activeIncident.confidence}%</span>
                    </div>

                    <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
                      <span className="text-slate-400 font-medium">Loss Score bounds</span>
                      <span className="text-white font-bold font-mono">{(activeIncident.score || 0).toFixed(6)}</span>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-slate-400 font-medium block">Detailed Description Summary</span>
                      <p className="text-white font-bold leading-relaxed bg-black/40 border border-white/5 p-3 rounded-xl">
                        {activeIncident.summary}
                      </p>
                    </div>

                    {/* Calibrated Threat Severity Scale */}
                    <div className="space-y-1 pt-2">
                      <div className="flex justify-between text-xs text-slate-400 font-mono font-bold">
                        <span>SEVERITY CRITICALITY</span>
                        <span className={getSeverityStyle(activeIncident.severity).text}>
                          {activeIncident.severity?.toUpperCase()}
                        </span>
                      </div>
                      <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            activeIncident.severity === "CRITICAL" ? "bg-red-500" : activeIncident.severity === "HIGH" ? "bg-orange-500" : "bg-yellow-400"
                          }`}
                          style={{ 
                            width: activeIncident.severity === "CRITICAL" ? "100%" : activeIncident.severity === "HIGH" ? "70%" : "40%" 
                          }} 
                        />
                      </div>
                    </div>
                  </CardContent>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-500 font-bold">
                    Awaiting threat selection...
                  </div>
                )}
              </div>

              {activeIncident && !(resolvedMap[activeIncident.id] || activeIncident.resolved) && (
                <div className="pt-6 border-t border-cyan-500/10 flex flex-col gap-2 shrink-0">
                  <Button 
                    onClick={() => handleResolve(activeIncident.id)}
                    disabled={!isAdmin}
                    className="w-full py-2.5 text-xs font-bold bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-400 text-black rounded-xl shadow-lg disabled:shadow-none transition-all"
                  >
                    {!isAdmin ? "Dismiss Locked (Admin Only)" : "Dismiss Active Alert Indicator"}
                  </Button>
                </div>
              )}
            </Card>

          </div>
    </>
  );
}