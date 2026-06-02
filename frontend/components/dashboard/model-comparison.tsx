"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRFStore } from "@/store/rf-store";
import { 
  Cpu, 
  Layers, 
  GitMerge, 
  Activity, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  MapPin
} from "lucide-react";

export function ModelComparison() {
  const { rf } = useRFStore();
  
  const activeModel = rf?.status?.active_model || "autoencoder";
  const timestamp = rf?.status?.timestamp 
    ? new Date(rf.status.timestamp).toLocaleTimeString() 
    : new Date().toLocaleTimeString();

  const modelScores = rf?.status?.model_scores || {};

  // ==========================================
  // Bespoke Model Metric Calculations
  // ==========================================

  // 1. PyTorch Autoencoder Metrics
  const { isAEAnomaly, aeMatchPercent, rawAeScore, aeThreshold } = useMemo(() => {
    const rawScore = modelScores.autoencoder?.score ?? rf?.status?.score ?? 0.0000045;
    const threshold = 7.264490864634342e-06;
    const isAnomaly = (modelScores.autoencoder?.status === "ANOMALY") || (rawScore > threshold);
    
    const ratio = rawScore / threshold;
    const match = isAnomaly 
      ? Math.max(5.0, 80.0 * Math.exp(-(ratio - 1.0) * 0.15)) 
      : Math.min(100.0, 100.0 - ratio * 20.0);

    return {
      isAEAnomaly: isAnomaly,
      aeMatchPercent: parseFloat(match.toFixed(2)),
      rawAeScore: rawScore,
      aeThreshold: threshold
    };
  }, [modelScores, rf]);

  // 2. Random Forest Classifier Metrics
  const { isRFAnomaly, rfScore, rfVotes, rfMatchPercent } = useMemo(() => {
    const score = modelScores.random_forest?.score ?? 0.05;
    const isAnomaly = (modelScores.random_forest?.status === "ANOMALY") || (score > 0.5);
    
    const votes = Math.round(score * 128);
    const match = score * 100;

    return {
      isRFAnomaly: isAnomaly,
      rfScore: score,
      rfVotes: votes,
      rfMatchPercent: parseFloat(match.toFixed(2))
    };
  }, [modelScores]);

  // 3. Distance-Based KNN Outlier Metrics
  const { isKNNAnomaly, knnScore, knnDistance, knnProximityPercent } = useMemo(() => {
    const score = modelScores.knn?.score ?? 0.0;
    const isAnomaly = (modelScores.knn?.status === "ANOMALY") || (score > 0.5);
    
    const distance = isAnomaly ? 1.5 + score * 2.8 : 0.12 + score * 0.48;
    const proximity = Math.max(5.0, Math.min(100.0, 100.0 - (distance / 4.5) * 100.0));

    return {
      isKNNAnomaly: isAnomaly,
      knnScore: score,
      knnDistance: parseFloat(distance.toFixed(3)),
      knnProximityPercent: parseFloat(proximity.toFixed(2))
    };
  }, [modelScores]);

  // Autoencoder SVG overlap wave
  const { aeInputPath, aeReconPath } = useMemo(() => {
    const points = 24;
    const input = [];
    const recon = [];
    for (let i = 0; i <= points; i++) {
      const x = (i / points) * 115;
      const baseAngle = i * 0.45;
      
      const yInput = 25 + Math.sin(baseAngle) * 15;
      input.push(`${i === 0 ? "M" : "L"} ${x} ${yInput}`);

      const offset = isAEAnomaly ? 0.95 : 0.0;
      const deformation = isAEAnomaly ? Math.sin(i * 0.18) * 6 : 0;
      const yRecon = 25 + Math.sin(baseAngle + offset) * 15 + deformation;
      recon.push(`${i === 0 ? "M" : "L"} ${x} ${yRecon}`);
    }
    return { aeInputPath: input.join(" "), aeReconPath: recon.join(" ") };
  }, [isAEAnomaly]);

  // KNN Outlier SVG Coordinate Dot
  const knnCoordinate = useMemo(() => {
    if (isKNNAnomaly) {
      return { x: 95, y: 8, color: "stroke-red-500 fill-red-500" };
    }
    return { x: 58 + (knnScore * 10), y: 22 - (knnScore * 8), color: "stroke-teal-400 fill-teal-400" };
  }, [isKNNAnomaly, knnScore]);

  const isAEActive = activeModel.toLowerCase() === "autoencoder";
  const isRFActive = activeModel.toLowerCase() === "random_forest";
  const isKNNActive = activeModel.toLowerCase() === "knn";

  return (
    <div className="rounded-[1.5rem] border border-cyan-500/10 bg-[#07111f] p-4.5 shadow-[0_0_50px_rgba(0,255,255,0.02)] h-full flex flex-col justify-between">
      <div className="flex flex-col h-full justify-between">
        {/* HEADER */}
        <div className="flex flex-row items-center justify-between mb-3 pb-0 shrink-0">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-cyan-300 animate-pulse" />
            <div>
              <h2 className="text-base font-black text-white leading-none">Consensus Verification</h2>
              <div className="text-slate-400 text-[10px] mt-1">Multi-model consensus monitoring deck</div>
            </div>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 text-cyan-300 font-bold text-[10px] tracking-widest font-mono uppercase">
            <span className="h-1 w-1 rounded-full bg-cyan-400 animate-ping" />
            Active
          </div>
        </div>

        {/* SCROLLABLE CONTENT BLOCK (max-h-[240px]) */}
        <div className="space-y-3 mt-2 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar flex-1">
          <div className="grid grid-cols-1 gap-3">

            {/* CARD 1: AUTOENCODER */}
            <div className={`border rounded-2xl p-3 transition-all duration-300 bg-black/25 ${
              isAEActive 
                ? "border-cyan-500/35 bg-cyan-500/[0.02] shadow-[0_0_15px_rgba(6,182,212,0.04)]" 
                : "border-white/5 hover:border-white/10"
            }`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                {/* Left side: Telemetry stats */}
                <div className="space-y-1 flex-1 w-full">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-cyan-400" />
                    <span className="text-xs font-black text-white leading-none">Neural Reconstruction Engine</span>
                    <span className="text-[9px] font-black text-slate-400 tracking-wider">Deep AE</span>
                    {isAEActive && (
                      <span className="px-1 py-0.5 rounded bg-cyan-500 text-black text-[7px] font-black tracking-widest font-mono uppercase shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-end gap-4 mt-1">
                    <div>
                      <span className="text-[9px] text-slate-400 font-black tracking-widest block uppercase mb-0.5">Baseline Match</span>
                      <span className={`text-base font-black font-mono leading-none ${isAEAnomaly ? "text-red-400 animate-pulse" : "text-cyan-400"}`}>
                        {aeMatchPercent}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-black tracking-widest block uppercase mb-0.5">State</span>
                      {isAEAnomaly ? (
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/25 text-red-400 text-[9px] font-black tracking-widest font-mono uppercase">
                          <ShieldAlert className="h-2.5 w-2.5 animate-pulse" />
                          Anomaly
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-[9px] font-black tracking-widest font-mono uppercase">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          Normal
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 font-bold pt-0.5">
                    MSE LOSS: <span className="text-slate-200">{rawAeScore.toExponential(3)}</span> / {aeThreshold.toExponential(2)}
                  </div>
                </div>

                {/* Right side: SVG wave overlay */}
                <div className="w-[80px] h-[35px] border border-cyan-500/15 bg-black/40 rounded-lg relative overflow-hidden shrink-0 flex items-center justify-center p-1">
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.02)_1px,transparent_1px)] bg-[size:8px_8px] pointer-events-none" />
                  <svg className="w-full h-full" viewBox="0 0 115 50">
                    {isAEAnomaly && (
                      <polygon points="0,25 20,40 40,10 60,35 80,15 100,30 115,25" fill="rgba(239,68,68,0.12)" className="animate-pulse" />
                    )}
                    <path d={aeInputPath} fill="none" stroke="rgba(34,211,238,0.7)" strokeWidth="2.5" strokeLinecap="round" />
                    <path d={aeReconPath} fill="none" stroke={isAEAnomaly ? "rgba(239,68,68,0.85)" : "rgba(168,85,247,0.7)"} strokeWidth="2.5" strokeDasharray={isAEAnomaly ? "2 2" : "none"} strokeLinecap="round" className={isAEAnomaly ? "animate-pulse" : ""} />
                  </svg>
                  <div className="absolute bottom-0.5 right-1 text-[6px] font-mono font-bold text-slate-500 tracking-wider">
                    {isAEAnomaly ? "DEVIATION" : "LOCKED"}
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: RANDOM FOREST */}
            <div className={`border rounded-2xl p-3 transition-all duration-300 bg-black/25 ${
              isRFActive 
                ? "border-purple-500/35 bg-purple-500/[0.02] shadow-[0_0_15px_rgba(168,85,247,0.04)]" 
                : "border-white/5 hover:border-white/10"
            }`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                {/* Left side: Telemetry stats */}
                <div className="space-y-1 flex-1 w-full">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <GitMerge className="h-3.5 w-3.5 text-purple-400" />
                    <span className="text-xs font-black text-white leading-none">Supervised Threat Classifier</span>
                    <span className="text-[9px] font-black text-slate-400 tracking-wider">RF Trees</span>
                    {isRFActive && (
                      <span className="px-1 py-0.5 rounded bg-purple-500 text-white text-[7px] font-black tracking-widest font-mono uppercase shadow-[0_0_8px_rgba(168,85,247,0.3)]">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-end gap-4 mt-1">
                    <div>
                      <span className="text-[9px] text-slate-400 font-black tracking-widest block uppercase mb-0.5">Threat Match</span>
                      <span className={`text-base font-black font-mono leading-none ${isRFAnomaly ? "text-red-400 animate-pulse" : "text-purple-400"}`}>
                        {rfMatchPercent}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-black tracking-widest block uppercase mb-0.5">State</span>
                      {isRFAnomaly ? (
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/25 text-red-400 text-[9px] font-black tracking-widest font-mono uppercase animate-pulse">
                          <ShieldAlert className="h-2.5 w-2.5" />
                          {modelScores.random_forest?.threat_type?.replace("_", " ") || "Threat Confirmed"}
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/25 text-purple-300 text-[9px] font-black tracking-widest font-mono uppercase">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          Normal
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 font-bold pt-0.5">
                    TREE CONSENSUS: <span className="text-slate-200">{rfVotes}</span> / 128 pathways
                  </div>
                </div>

                {/* Right side: Glowing tree matrix grid */}
                <div className="w-[80px] h-[35px] border border-purple-500/15 bg-black/40 rounded-lg relative shrink-0 flex items-center justify-center p-1">
                  <div className="grid grid-cols-5 gap-1 w-full h-full max-w-[70px] max-h-[25px]">
                    {Array.from({ length: 15 }).map((_, idx) => {
                      const isAnomNode = isRFAnomaly && (idx / 15.0) < rfScore;
                      return (
                        <div 
                          key={idx} 
                          className={`h-2 w-2 rounded-full border transition-all duration-300 ${
                            isAnomNode 
                              ? "bg-red-500 border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" 
                              : "bg-purple-950 border-purple-900"
                          }`} 
                        />
                      );
                    })}
                  </div>
                  <div className="absolute bottom-0.5 right-1.5 text-[7px] font-mono font-bold text-slate-500 tracking-wider">
                    {isRFAnomaly ? "VOTE" : "STABLE"}
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 3: KNN */}
            <div className={`border rounded-2xl p-3 transition-all duration-300 bg-black/25 ${
              isKNNActive 
                ? "border-teal-500/35 bg-teal-500/[0.02] shadow-[0_0_15px_rgba(20,184,166,0.04)]" 
                : "border-white/5 hover:border-white/10"
            }`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                {/* Left side: Telemetry stats */}
                <div className="space-y-1 flex-1 w-full">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-teal-400" />
                    <span className="text-xs font-black text-white leading-none">Distance-Based Outlier Core</span>
                    <span className="text-[9px] font-black text-slate-400 tracking-wider">KNN Space</span>
                    {isKNNActive && (
                      <span className="px-1 py-0.5 rounded bg-teal-500 text-black text-[7px] font-black tracking-widest font-mono uppercase shadow-[0_0_8px_rgba(20,184,166,0.3)]">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-end gap-4 mt-1">
                    <div>
                      <span className="text-[9px] text-slate-400 font-black tracking-widest block uppercase mb-0.5">Cluster Proximity</span>
                      <span className={`text-base font-black font-mono leading-none ${isKNNAnomaly ? "text-red-400 animate-pulse" : "text-teal-400"}`}>
                        {knnProximityPercent}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-black tracking-widest block uppercase mb-0.5">State</span>
                      {isKNNAnomaly ? (
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/25 text-red-400 text-[9px] font-black tracking-widest font-mono uppercase">
                          <ShieldAlert className="h-2.5 w-2.5" />
                          Outlier
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-teal-500/10 border border-teal-500/25 text-teal-300 text-[9px] font-black tracking-widest font-mono uppercase">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          Cluster In
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 font-bold pt-0.5">
                    DISTANCE: <span className="text-slate-200">{knnDistance}</span> units (Thresh: 0.50)
                  </div>
                </div>

                {/* Right side: SVG scatter constellation plot */}
                <div className="w-[80px] h-[35px] border border-teal-500/15 bg-black/40 rounded-lg relative shrink-0 flex items-center justify-center p-1">
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.02)_1px,transparent_1px)] bg-[size:8px_8px] pointer-events-none" />
                  <svg className="w-full h-full" viewBox="0 0 115 50">
                    <circle cx="35" cy="22" r="3.5" fill="none" stroke="rgba(20,184,166,0.2)" strokeWidth="1" />
                    <circle cx="30" cy="20" r="1.5" className="fill-teal-500/50" />
                    <circle cx="38" cy="18" r="1.5" className="fill-teal-500/50" />
                    <circle cx="42" cy="24" r="1.5" className="fill-teal-500/50" />
                    <circle cx="28" cy="27" r="1.5" className="fill-teal-500/50" />
                    <circle cx="35" cy="25" r="2.0" className="fill-teal-400" />
                    <line x1="35" y1="22" x2={knnCoordinate.x} y2={knnCoordinate.y} stroke={isKNNAnomaly ? "rgba(239,68,68,0.5)" : "rgba(20,184,166,0.4)"} strokeWidth="1.5" strokeDasharray="2 2" />
                    <circle cx={knnCoordinate.x} cy={knnCoordinate.y} r="3.5" className={`${knnCoordinate.color} ${isKNNAnomaly ? "animate-pulse" : ""}`} />
                  </svg>
                  <div className="absolute bottom-0.5 right-1 text-[6px] font-mono font-bold text-slate-500 tracking-wider">
                    {isKNNAnomaly ? "OUTLIER" : "CENTER"}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* FOOTER */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 pt-2 border-t border-white/5 text-[9px] font-bold font-mono text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-slate-500" />
            <span>LATENCY: </span>
            <span className="text-slate-300 font-extrabold">
              {((modelScores.autoencoder?.latency ?? 6.2) + 
                (modelScores.random_forest?.latency ?? 7.4) + 
                (modelScores.knn?.latency ?? 880.2)).toFixed(2)} ms
            </span>
          </div>
          <div className="flex items-center gap-1.5 md:justify-end">
            <MapPin className="h-3 w-3 text-slate-500" />
            <span>BOUNDS: </span>
            <span className="text-cyan-300 font-extrabold uppercase ml-1">Calibrated</span>
          </div>
        </div>
      </div>
    </div>
  );
}
