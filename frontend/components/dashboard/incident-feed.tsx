import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Clock } from "lucide-react";

interface Props {
  incidents: any;
}

export function IncidentFeed({ incidents }: Props) {
  if (!incidents?.data) return null;

  const getSeverityColors = (severity: string) => {
    const s = severity?.toUpperCase();
    if (s === "CRITICAL") return { text: "text-red-400", border: "border-red-500/25", bg: "bg-red-500/5", glow: "shadow-[0_0_20px_rgba(239,68,68,0.1)]" };
    if (s === "HIGH") return { text: "text-orange-400", border: "border-orange-500/25", bg: "bg-orange-500/5", glow: "shadow-[0_0_20px_rgba(249,115,22,0.1)]" };
    if (s === "MEDIUM") return { text: "text-yellow-400", border: "border-yellow-500/25", bg: "bg-yellow-500/5", glow: "shadow-[0_0_20px_rgba(234,179,8,0.1)]" };
    return { text: "text-green-400", border: "border-green-500/25", bg: "bg-green-500/5", glow: "shadow-[0_0_20px_rgba(34,197,94,0.05)]" };
  };

  return (
    <div className="rounded-[1.5rem] border border-cyan-500/10 bg-[#07111f] p-4.5 shadow-[0_0_50px_rgba(0,255,255,0.02)] h-full flex flex-col justify-between">
      <div className="flex flex-col h-full justify-between">
        <div className="flex flex-row items-center gap-2 mb-3 pb-0 shrink-0">
          <AlertTriangle className="h-5 w-5 text-cyan-300" />
          <h2 className="text-base font-black text-white">Recent Threats Feed</h2>
        </div>

        <div className="space-y-3 mt-2 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar flex-1">
          {incidents.data.length === 0 ? (
            <div className="text-center py-6 text-slate-300 font-semibold text-xs">
              No anomalies recorded. All networks secure.
            </div>
          ) : (
            incidents.data.slice(0, 5).map((incident: any) => {
              const colors = getSeverityColors(incident.severity);
              const date = new Date(incident.timestamp);
              const timeStr = isNaN(date.getTime())
                ? incident.timestamp
                : `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;

              return (
                <div
                  key={incident.id}
                  className={`border rounded-xl p-3 transition-all duration-300 hover:scale-[1.01] ${colors.border} ${colors.bg} ${colors.glow}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-block h-2 w-2 rounded-full ${incident.severity === 'CRITICAL' ? 'bg-red-500 animate-pulse' : 'bg-orange-500'}`} />
                      <span className={`text-[10px] font-black tracking-widest uppercase ${colors.text}`}>
                        {incident.severity}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-300 text-[10px] font-semibold font-mono">
                      <Clock className="h-3 w-3" />
                      <span suppressHydrationWarning>{timeStr}</span>
                    </div>
                  </div>

                  <div className="text-sm mt-1.5 font-black text-white leading-tight">
                    {incident.threat_type.replace("_", " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                  </div>

                  <div className="text-[11px] mt-1 text-slate-300 font-semibold leading-relaxed">
                    {incident.summary}
                  </div>

                  <div className="flex gap-2.5 mt-2 pt-2 border-t border-white/5 text-[9px] text-slate-300 font-bold font-mono">
                    <div>SCORE: <span className="text-slate-200">{(incident.score || 0.0).toFixed(5)}</span></div>
                    <div>CONFIDENCE: <span className="text-slate-200">{(incident.confidence || 0.0).toFixed(1)}%</span></div>
                    {incident.latency && <div>LATENCY: <span className="text-slate-200">{incident.latency.toFixed(1)}ms</span></div>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}