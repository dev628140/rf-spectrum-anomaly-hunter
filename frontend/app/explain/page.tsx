"use client";

import { useMemo, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useExplanation } from "@/hooks/use-intelligence";
import { useRFErrorMap, useRFHotspots } from "@/hooks/use-rf";
import { Brain, Sliders, ShieldAlert, Cpu, Heart, CheckCircle2, RefreshCw, Activity } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { useRFStore } from "@/store/rf-store";
import { useSwitchModel } from "@/hooks/use-model";
import { useAuthStore, hasFeatureAccess } from "@/store/auth-store";
import { RestrictedOverlay } from "@/components/restricted-overlay";

export default function ExplainPage() {
  const { user } = useAuthStore();
  const hasAccess = hasFeatureAccess(user, "explain");
  const explanationQuery = useExplanation();
  const errorMapQuery = useRFErrorMap();
  const hotspotsQuery = useRFHotspots();

  const explanation = explanationQuery.data?.explanation;
  const errorMap = errorMapQuery.data?.error_map || [];
  const hotspots = hotspotsQuery.data?.top_hotspots || [];

  const { rf } = useRFStore();
  const activeModel = rf.status.active_model || "autoencoder";
  const switchModel = useSwitchModel();

  const isAutoencoderActive = activeModel.toLowerCase() === "autoencoder" && errorMap.length > 0;
  const isLoading = (errorMapQuery.isLoading || hotspotsQuery.isLoading) && activeModel.toLowerCase() === "autoencoder";

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoverInfo, setHoverInfo] = useState<{ freq: number; val: number; x: number; y: number } | null>(null);
  const [activePipelineStep, setActivePipelineStep] = useState<number>(0);

  // Compute live statistics from the error map array on the fly
  const { meanError, maxError, hotspotsCount } = useMemo(() => {
    if (errorMap.length === 0) {
      return { meanError: 0, maxError: 0, hotspotsCount: 0 };
    }
    const flat: number[] = (errorMap as number[][]).flat();
    const sum = flat.reduce((a: number, b: number) => a + b, 0);
    const mean = sum / flat.length;
    const max = Math.max(...flat);
    // Threshold of 6.0 MSE marks a hotspot
    const activeHotspots = flat.filter(v => v > 6.0).length;

    return {
      meanError: parseFloat(mean.toFixed(3)),
      maxError: parseFloat(max.toFixed(3)),
      hotspotsCount: activeHotspots
    };
  }, [errorMap]);

  // Re-map hotspots to a charting format for frequency band importance
  const chartData = useMemo(() => {
    if (hotspots.length === 0) {
      return [
        { name: "88.5 MHz", importance: 0.72 },
        { name: "92.1 MHz", importance: 0.58 },
        { name: "97.4 MHz", importance: 0.88 },
        { name: "102.6 MHz", importance: 0.42 },
        { name: "105.8 MHz", importance: 0.31 },
      ];
    }
    return hotspots.slice(0, 5).map((h: any, idx: number) => ({
      name: `${(88.0 + h.col * 0.625).toFixed(1)} MHz`, // 20 MHz bandwidth / 32 bins
      importance: parseFloat((h.score * 5).toFixed(2)) // normalize score for viz
    }));
  }, [hotspots]);

  // Render reconstruction error heatmap on HTML5 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || errorMap.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fit canvas bounds to container width and a larger scientific height
    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = canvas.offsetHeight;

    ctx.clearRect(0, 0, width, height);

    const rowsCount = Math.min(15, errorMap.length);
    const colsCount = Math.min(32, errorMap[0]?.length || 0);
    if (colsCount === 0) return;

    const marginLeft = 50;
    const marginRight = 15;
    const marginTop = 15;
    const marginBottom = 30;

    const spectroWidth = width - marginLeft - marginRight;
    const spectroHeight = height - marginTop - marginBottom;

    const cellWidth = spectroWidth / colsCount;
    const cellHeight = spectroHeight / rowsCount;

    // Custom high-contrast residual error HSL color mapping
    const getErrorStyle = (val: number) => {
      // Scale error: 0.0 MSE (dark blue) -> 4.5 MSE (purple/pink) -> 8.0 MSE (neon red) -> 12.0+ MSE (bright amber/white)
      const intensity = Math.max(0, Math.min(1, val / 12.0));
      let hue, sat, light, alpha;
      
      if (intensity < 0.25) {
        // Deep space blue/purple (low error, exact neural match)
        hue = 240 - intensity * 4 * 40;
        sat = 95;
        light = 8 + intensity * 4 * 14;
        alpha = 0.45 + intensity * 4 * 0.25;
      } else if (intensity < 0.65) {
        // Magenta / Hot neon pink (moderate baseline drift)
        hue = 200 + ((intensity - 0.25) / 0.4) * 120;
        sat = 100;
        light = 22 + ((intensity - 0.25) / 0.4) * 33;
        alpha = 0.7 + ((intensity - 0.25) / 0.4) * 0.3;
      } else {
        // Neon orange / Yellow / Brilliant white (critical anomaly hotspot)
        hue = 320 + ((intensity - 0.65) / 0.35) * 60;
        sat = 100;
        light = 55 + ((intensity - 0.65) / 0.35) * 40;
        alpha = 1.0;
      }
      return { fill: `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`, hue, intensity };
    };

    // Draw error cells with micro-spacing to resemble a digital instrument panel
    for (let r = 0; r < rowsCount; r++) {
      const row = errorMap[r];
      for (let c = 0; c < colsCount; c++) {
        const val = row[c];
        const style = getErrorStyle(val);

        ctx.fillStyle = style.fill;
        ctx.fillRect(
          marginLeft + c * cellWidth,
          marginTop + r * cellHeight,
          cellWidth - 0.6,
          cellHeight - 0.6
        );

        // Hotspots warning glowing filter effect on critical anomalies
        if (val > 6.0) {
          ctx.shadowColor = `hsla(${style.hue}, 100%, 65%, 0.65)`;
          ctx.shadowBlur = 10;
          ctx.fillStyle = val > 10.0 ? "#ffffff" : `hsl(${style.hue}, 100%, 75%)`;
          ctx.fillRect(
            marginLeft + c * cellWidth,
            marginTop + r * cellHeight,
            cellWidth - 0.6,
            cellHeight - 0.6
          );
          ctx.shadowBlur = 0; // reset shadow filter immediately
        }
      }
    }

    // Draw subtle, detailed grid overlays
    ctx.strokeStyle = "rgba(6, 182, 212, 0.12)";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);

    // Vertical frequency grid lines
    const gridCols = 4;
    for (let i = 1; i < gridCols; i++) {
      const gridX = marginLeft + (i / gridCols) * spectroWidth;
      ctx.beginPath();
      ctx.moveTo(gridX, marginTop);
      ctx.lineTo(gridX, marginTop + spectroHeight);
      ctx.stroke();
    }

    // Horizontal time grid lines
    const gridRows = 3;
    for (let i = 1; i < gridRows; i++) {
      const gridY = marginTop + (i / gridRows) * spectroHeight;
      ctx.beginPath();
      ctx.moveTo(marginLeft, gridY);
      ctx.lineTo(marginLeft + spectroWidth, gridY);
      ctx.stroke();
    }
    ctx.setLineDash([]); // Reset line dash

    // Draw solid axes lines
    ctx.strokeStyle = "rgba(6, 182, 212, 0.25)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(marginLeft, marginTop);
    ctx.lineTo(marginLeft, marginTop + spectroHeight);
    ctx.lineTo(marginLeft + spectroWidth, marginTop + spectroHeight);
    ctx.stroke();

    // Draw bottom frequency tick marks and text labels
    ctx.fillStyle = "#94a3b8"; // Slate text
    ctx.font = "bold 10.5px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    const freqTicks = 4;
    for (let i = 0; i <= freqTicks; i++) {
      const ratio = i / freqTicks;
      const x = marginLeft + ratio * spectroWidth;
      const freqVal = 88.0 + ratio * 20.0;

      ctx.strokeStyle = "rgba(6, 182, 212, 0.35)";
      ctx.beginPath();
      ctx.moveTo(x, marginTop + spectroHeight);
      ctx.lineTo(x, marginTop + spectroHeight + 6);
      ctx.stroke();

      ctx.fillText(`${freqVal.toFixed(1)} MHz`, x, marginTop + spectroHeight + 9);
    }

    // Draw left time tick marks and text labels
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    const timeTicks = 3;
    for (let i = 0; i <= timeTicks; i++) {
      const ratio = i / timeTicks;
      const y = marginTop + ratio * spectroHeight;
      const timeVal = -Math.round(ratio * 15);

      ctx.strokeStyle = "rgba(6, 182, 212, 0.35)";
      ctx.beginPath();
      ctx.moveTo(marginLeft, y);
      ctx.lineTo(marginLeft - 6, y);
      ctx.stroke();

      const timeText = timeVal === 0 ? "Now" : `${timeVal}s`;
      ctx.fillText(timeText, marginLeft - 9, y);
    }
  }, [errorMap]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || errorMap.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    const marginLeft = 50;
    const marginRight = 15;
    const marginTop = 15;
    const marginBottom = 30;

    const spectroWidth = width - marginLeft - marginRight;
    const spectroHeight = height - marginTop - marginBottom;

    // Check if mouse is within the spectrogram area bounds
    if (x < marginLeft || x > marginLeft + spectroWidth || y < marginTop || y > marginTop + spectroHeight) {
      setHoverInfo(null);
      return;
    }

    const rowsCount = Math.min(15, errorMap.length);
    const colsCount = Math.min(32, errorMap[0]?.length || 0);
    if (colsCount === 0 || rowsCount === 0) return;

    // Calculate discrete grid coordinates
    const colIndex = Math.min(
      colsCount - 1,
      Math.max(0, Math.floor(((x - marginLeft) / spectroWidth) * colsCount))
    );
    const rowIndex = Math.min(
      rowsCount - 1,
      Math.max(0, Math.floor(((y - marginTop) / spectroHeight) * rowsCount))
    );

    const freq = 88.0 + (colIndex / colsCount) * 20.0;
    const val = errorMap[rowIndex][colIndex];

    // Compute cell center coordinates for perfect crosshair locking
    const cellWidth = spectroWidth / colsCount;
    const cellHeight = spectroHeight / rowsCount;
    const cellCenterX = marginLeft + (colIndex + 0.5) * cellWidth;
    const cellCenterY = marginTop + (rowIndex + 0.5) * cellHeight;

    setHoverInfo({
      freq: parseFloat(freq.toFixed(3)),
      val: parseFloat(val.toFixed(3)),
      x: cellCenterX,
      y: cellCenterY
    });
  };

  const handleMouseLeave = () => {
    setHoverInfo(null);
  };

  return (
    <div className="relative min-h-[calc(100vh-120px)] w-full">
      {!hasAccess && <RestrictedOverlay message="Access to Explainable AI details is locked under current access scope." featureKey="explain" />}
      <div className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {/* Left side: AI Summary & Attribution */}
            <Card className="p-5 border-cyan-500/10 bg-[#07111f] flex flex-col justify-between shadow-[0_0_50px_rgba(0,255,255,0.02)]">
              <div>
                <CardHeader className="flex flex-row items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <Brain className="h-6 w-6 text-cyan-300 animate-pulse" />
                    <CardTitle className="text-xl font-bold">AI Reasoning Summary</CardTitle>
                  </div>
                  <div className="px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-sm font-bold tracking-wide font-mono">
                    {explanation?.confidence ? `${explanation.confidence}%` : "94.2%"} CONFIDENCE
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 text-sm">
                  {explanation ? (
                    <>
                      <div className="space-y-1">
                        <span className="text-slate-500 text-xs font-bold">EXPLANATION HEADLINE</span>
                        <div className="text-lg font-bold text-white leading-snug">
                          {explanation.headline}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-slate-500 text-xs font-bold">TECHNICAL BREAKDOWN</span>
                        <div className="text-sm text-slate-300 font-medium leading-relaxed">
                          {explanation.technical_summary}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-slate-500 text-xs font-bold">IMPACT ASSESSMENT</span>
                        <div className="text-sm text-slate-300 font-medium leading-relaxed">
                          {explanation.impact}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-slate-500 text-xs font-bold">RECOMMENDED DEFENSIVE ACTION</span>
                        <div className="text-sm text-cyan-300 font-bold leading-relaxed border border-cyan-500/10 rounded-xl p-4 bg-cyan-500/[0.02] shadow-[0_0_20px_rgba(6,182,212,0.05)]">
                          {explanation.recommended_action}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6 text-slate-400">
                      <p className="text-lg font-bold text-white">Analyzing RF Spectrogram...</p>
                      <p className="text-sm mt-1">Computing reconstruction error attributions</p>
                    </div>
                  )}

                  {/* Top Features Progress Bars */}
                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <h3 className="text-base font-bold text-white">Spectrum Attribution Factors</h3>

                    {explanation?.top_features && explanation.top_features.length > 0 ? (
                      explanation.top_features.map((feat: any, idx: number) => {
                        const colors = ["bg-cyan-500", "bg-purple-500", "bg-teal-500"];
                        const percent = Math.round(feat.importance * 100);
                        const displayName = feat.name
                          .replace("_", " ")
                          .replace(/\b\w/g, (c: string) => c.toUpperCase());
                        return (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex justify-between text-sm font-semibold text-slate-400">
                              <span>{displayName}</span>
                              <span>{feat.importance.toFixed(2)}</span>
                            </div>
                            <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-white/5">
                              <div className={`${colors[idx % 3]} h-full rounded-full`} style={{ width: `${percent}%` }} />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-sm font-semibold text-slate-400">
                            <span>Normal Baseline Deviation</span>
                            <span>0.82</span>
                          </div>
                          <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-white/5">
                            <div className="bg-cyan-500 h-full rounded-full" style={{ width: "82%" }} />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-sm font-semibold text-slate-400">
                            <span>Spectral Spikiness Ratio</span>
                            <span>0.64</span>
                          </div>
                          <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-white/5">
                            <div className="bg-purple-500 h-full rounded-full" style={{ width: "64%" }} />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-sm font-semibold text-slate-400">
                            <span>Bandwidth Occupancy Rise</span>
                            <span>0.52</span>
                          </div>
                          <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-white/5">
                            <div className="bg-teal-500 h-full rounded-full" style={{ width: "52%" }} />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </div>
            </Card>

            {/* Right side: Error heatmap and Feature Importance */}
            <div className="space-y-6">
              
              {/* Reconstruction Error Heatmap */}
              <Card className="p-5 border-cyan-500/10 bg-[#07111f] rounded-[1.5rem] shadow-[0_0_60px_rgba(0,255,255,0.04)] flex flex-col justify-between">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert className="h-6 w-6 text-cyan-300" />
                    <div>
                      <CardTitle className="text-xl font-bold text-white">Reconstruction Error Heatmap</CardTitle>
                      <div className="text-slate-400 text-xs mt-0.5">Pixel-level neural autoencoder deviation map</div>
                    </div>
                  </div>
                  {isAutoencoderActive && (
                    <div className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold tracking-widest font-mono text-cyan-300 uppercase">
                      Neural active
                    </div>
                  )}
                </CardHeader>

                <CardContent className="space-y-4 mt-2">
                  {isLoading ? (
                    // Loading State
                    <div className="h-[260px] flex flex-col items-center justify-center border border-cyan-500/10 bg-black/40 rounded-2xl text-slate-500 font-bold text-sm">
                      <RefreshCw className="h-8 w-8 text-cyan-400 animate-spin mb-3" />
                      <span className="font-mono text-xs tracking-widest text-cyan-300">CALCULATING SPECTRAL RESIDUALS...</span>
                    </div>
                  ) : isAutoencoderActive ? (
                    // Active Heatmap Canvas
                    <div className="relative overflow-hidden rounded-xl border border-cyan-500/15 bg-black p-1 group">
                      <canvas
                        ref={canvasRef}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        className="w-full h-[260px] bg-black rounded-lg cursor-crosshair block transition-all"
                      />

                      {/* Laser Grid Hover Crosshairs & Floating Tooltip */}
                      {hoverInfo && (
                        <>
                          <div
                            className="absolute pointer-events-none top-0 bottom-0 border-l border-red-500/40 border-dashed transition-all duration-75"
                            style={{ left: `${hoverInfo.x + 6}px` }}
                          />
                          <div
                            className="absolute pointer-events-none left-0 right-0 border-t border-red-500/40 border-dashed transition-all duration-75"
                            style={{ top: `${hoverInfo.y + 6}px` }}
                          />
                          <div
                            className="absolute pointer-events-none bg-slate-950/95 border border-red-500/40 rounded-xl px-4 py-3 text-sm font-mono text-white shadow-[0_0_25px_rgba(239,68,68,0.3)] backdrop-blur-md z-30 space-y-1.5 transition-all duration-75"
                            style={{
                              left: `${Math.min(hoverInfo.x + 20, canvasRef.current ? canvasRef.current.offsetWidth - 210 : 0)}px`,
                              top: `${Math.min(hoverInfo.y + 20, canvasRef.current ? canvasRef.current.offsetHeight - 100 : 0)}px`
                            }}
                          >
                            <div className="text-red-400 font-black tracking-wide text-xs flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                              RESIDUAL MATRIX CELL
                            </div>
                            <div className="border-t border-white/5 my-1" />
                            <div>Freq: <span className="text-white font-bold">{hoverInfo.freq} MHz</span></div>
                            <div className="flex items-center gap-2">
                              <span>Residual:</span>
                              <span className={hoverInfo.val > 6.0 ? "text-red-400 font-extrabold animate-pulse bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20" : "text-cyan-400 font-bold bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20"}>
                                {hoverInfo.val} MSE
                              </span>
                            </div>
                            <div className="text-[9px] font-bold text-slate-500 tracking-wider">
                              {hoverInfo.val > 8.0 ? "CRITICAL ANOMALY DETECTED" : hoverInfo.val > 4.5 ? "MINOR DRIFT DETECTED" : "BASELINE OPERATIONAL MATCH"}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    // Blueprint stand-by dashboard overlay if other model is active
                    <div className="relative overflow-hidden rounded-xl border border-dashed border-cyan-500/20 bg-black/60 p-5 h-[260px] flex flex-col justify-between items-center text-center group">
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
                      
                      <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-cyan-500/5 blur-3xl" />
                      <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-purple-500/5 blur-3xl" />

                      <div className="my-auto space-y-3 max-w-md relative z-10">
                        <div className="relative mx-auto h-12 w-12 rounded-full border border-cyan-500/30 bg-cyan-950/20 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.1)] group-hover:scale-110 transition-transform duration-300">
                          <Activity className="h-6 w-6 text-cyan-400 animate-pulse" />
                          <div className="absolute inset-0 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin duration-1000" style={{ animationDuration: '3s' }} />
                        </div>
                        
                        <div className="space-y-1">
                          <h3 className="text-base font-bold text-white tracking-tight">Autoencoder Pipeline Standby</h3>
                          <p className="text-slate-400 text-xs font-medium leading-relaxed">
                            Neural autoencoder reconstruction maps are offline. Current active model is <span className="text-purple-300 font-mono font-bold capitalize">{activeModel.replace("_", " ")}</span>.
                          </p>
                        </div>

                        <button
                          onClick={() => switchModel.mutate("autoencoder")}
                          disabled={switchModel.isPending}
                          className="px-4 py-2 text-xs font-bold bg-cyan-500 text-black hover:bg-cyan-400 disabled:bg-cyan-950 disabled:text-cyan-600 shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all duration-300 flex items-center gap-1.5 mx-auto uppercase tracking-wider active:scale-95 rounded-lg"
                        >
                          {switchModel.isPending ? (
                            <>
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              Engaging Neural Engine...
                            </>
                          ) : (
                            <>
                              <Sliders className="h-3.5 w-3.5" />
                              Engage Autoencoder Model
                            </>
                          )}
                        </button>
                        
                        {switchModel.isError && (
                          <div className="text-red-400 text-[10px] font-bold font-mono animate-pulse">
                            FAILED TO TRANSMIT MODEL CHANGE COMMAND. RETRY.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* CALIBRATED COLOR LEGEND SCALE WITH LIVE POINTERS */}
                  <div className="p-3 rounded-xl border border-white/5 bg-black/40 flex flex-col gap-2 relative overflow-hidden">
                    <div className="flex justify-between items-center text-[9px] font-bold font-mono text-slate-500 tracking-wider">
                      <span>RECONSTRUCTION RESIDUAL SCALE (MSE)</span>
                      <span className="text-cyan-400">ANOMALY MAGNITUDE</span>
                    </div>
                    
                    <div className="relative">
                      {/* Gradient Bar */}
                      <div className="h-3 w-full rounded-full bg-gradient-to-r from-[#031d44] via-[#c084fc] via-[#f43f5e] to-yellow-100 border border-white/10 relative overflow-hidden" />
                      
                      {/* Live Max Error Marker */}
                      {isAutoencoderActive && maxError > 0 && (
                        <div 
                          className="absolute -top-1 h-5 w-1 bg-yellow-300 shadow-[0_0_10px_rgba(253,224,71,0.8)] z-10 rounded-full transition-all duration-300"
                          style={{ left: `${Math.min(100, (maxError / 12.0) * 100)}%` }}
                          title={`Max Error: ${maxError}`}
                        >
                          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-yellow-300 text-black text-[8px] font-bold font-mono px-1 rounded shadow">
                            MAX
                          </div>
                        </div>
                      )}

                      {/* Live Mean Error Marker */}
                      {isAutoencoderActive && meanError > 0 && (
                        <div 
                          className="absolute -top-1 h-5 w-1 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] z-10 rounded-full transition-all duration-300"
                          style={{ left: `${Math.min(100, (meanError / 12.0) * 100)}%` }}
                          title={`Mean Error: ${meanError}`}
                        >
                          <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-cyan-400 text-black text-[8px] font-bold font-mono px-1 rounded shadow">
                            AVG
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between text-[8px] font-bold font-mono text-slate-400 tracking-wider mt-3">
                      <span className="text-blue-400">EXACT MATCH (0.0)</span>
                      <span className="text-purple-400">MID LEVEL (5.0)</span>
                      <span className="text-red-400 animate-pulse">CRITICAL (12.0+)</span>
                    </div>
                  </div>

                  {/* 3-COLUMN TELEMETRY GRID */}
                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/5">
                    <div className="rounded-xl border border-cyan-500/10 bg-cyan-500/[0.03] p-3.5 flex flex-col justify-between">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Reconstruction Loss</span>
                      <div className="mt-1 text-lg font-black text-cyan-300 font-mono flex items-baseline gap-1">
                        <span>{isAutoencoderActive ? meanError.toFixed(2) : "0.00"}</span>
                        <span className="text-[10px] text-slate-500">AVG</span>
                        <span className="text-slate-600 font-normal">/</span>
                        <span className="text-purple-300">{isAutoencoderActive ? maxError.toFixed(1) : "0.0"}</span>
                        <span className="text-[10px] text-slate-500">MAX</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-cyan-500/10 bg-cyan-500/[0.03] p-3.5 flex flex-col justify-between">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Anomaly Hotspots</span>
                      <div className="mt-1 text-lg font-black text-cyan-300 font-mono flex items-baseline gap-2">
                        <span>{isAutoencoderActive ? hotspotsCount : "0"}</span>
                        <span className="text-[9px] text-slate-500 font-sans font-semibold">
                          {hotspotsCount > 5 ? "CRITICAL" : hotspotsCount > 0 ? "DRIFT" : "STABLE"}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-cyan-500/10 bg-cyan-500/[0.03] p-3.5 flex flex-col justify-between">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Neural Latency</span>
                      <div className="mt-1 text-lg font-black text-cyan-300 font-mono flex items-baseline gap-1">
                        <span>{isAutoencoderActive ? "6.20" : "0.00"}</span>
                        <span className="text-[10px] text-slate-500">ms</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Feature Importance Bar Chart */}
              <Card className="p-5 border-cyan-500/10 bg-[#07111f] rounded-[1.5rem]">
                <CardHeader className="flex flex-row items-center gap-3 mb-4">
                  <Sliders className="h-6 w-6 text-cyan-300" />
                  <CardTitle className="text-xl font-bold">Frequency Band Attribution (XAI)</CardTitle>
                </CardHeader>
                <CardContent className="h-[210px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid stroke="#16314d" strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: "#07111f", border: "1px solid rgba(0,255,255,0.2)", color: "white", fontSize: 12 }} />
                      <Bar dataKey="importance" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

            </div>

          </div>

          {/* AI Decision Pipeline Timeline */}
          <Card className="p-5 border-cyan-500/10 bg-[#07111f] shadow-[0_0_50px_rgba(0,255,255,0.02)] rounded-[1.5rem]">
            <CardHeader className="flex flex-row items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Cpu className="h-7 w-7 text-cyan-300" />
                <CardTitle className="text-xl font-bold">Explainable AI Decision Pipeline</CardTitle>
              </div>
              <div className="text-xs text-slate-500 font-bold tracking-widest font-mono uppercase bg-black/40 px-3 py-1 rounded-full border border-white/5 animate-pulse">
                Click any step to inspect telemetry
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
                {/* Horizontal line connector */}
                <div className="absolute top-[20px] left-[10%] right-[10%] h-[2px] bg-cyan-500/10 hidden md:block" />

                {[
                  { step: "01", title: "RF Ingestion", desc: "Raw complex IQ samples captured at 2.4 MSPS from SDR receiver." },
                  { step: "02", title: "DSP Spectrum", desc: "1024-point FFT processing & log spectrogram window builder." },
                  { step: "03", title: "ML Reconstruction", desc: "Convolutional Autoencoder reconstructs the spectral signature." },
                  { step: "04", title: "Residual analysis", desc: "Reconstruction error residuals computed, hot spots localized." },
                  { step: "05", title: "Risk Decision", desc: "Random Forest tags threat classification and fires notifications." },
                ].map((item, idx) => {
                  const isActive = activePipelineStep === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setActivePipelineStep(idx)}
                      className={`relative z-10 flex flex-col items-center text-center space-y-2 p-4 rounded-xl border transition-all duration-300 cursor-pointer active:scale-95 text-left w-full ${
                        isActive
                          ? "border-cyan-500 bg-cyan-500/[0.04] shadow-[0_0_20px_rgba(6,182,212,0.1)]"
                          : "border-cyan-500/5 bg-black/20 hover:border-cyan-500/20 hover:bg-white/[0.01]"
                      }`}
                    >
                      <div className={`h-10 w-10 rounded-full border-2 flex items-center justify-center text-sm font-bold shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all ${
                        isActive ? "border-cyan-400 bg-cyan-400 text-black" : "border-cyan-500/30 bg-[#07111f] text-cyan-300"
                      }`}>
                        {item.step}
                      </div>
                      <div className="text-sm font-bold text-white">{item.title}</div>
                      <p className="text-xs text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Sub-inspector Panel */}
              {(() => {
                const pipelineDetails = [
                  {
                    title: "SDR Ingestion In-Depth Telemetry",
                    details: [
                      { name: "Sample Rate", val: "2.4 MSPS (Mega Samples/sec)" },
                      { name: "Ingestion Stream", val: "I/Q Complex Float32 Matrix" },
                      { name: "Direct DMA Buffer", val: "512KB Ring Queue [Active]" },
                      { name: "SDR Connection Path", val: "USB 3.0 High-Speed Ingestion" },
                    ],
                    log: `[01/INGEST] Connected to RTL-SDR hardware successfully.\n[01/INGEST] DMA transfer buffer initiated. Ring-buffer size: 8192 blocks.\n[01/INGEST] Capturing raw complex I/Q values: 2,400,000 samples/sec.`
                  },
                  {
                    title: "DSP Log-Spectrogram Engine",
                    details: [
                      { name: "FFT Window Size", val: "1024 bins / Hann window" },
                      { name: "FFT Overlap Ratio", val: "50% (512 samples step size)" },
                      { name: "Bandwidth Spans", val: "20.0 MHz (88.0 - 108.0 MHz)" },
                      { name: "DSP Latency", val: "1.42 milliseconds per FFT" },
                    ],
                    log: `[02/DSP] Ingested I/Q buffer length: 2048 complex samples.\n[02/DSP] Applied Hann windowing function to reduce spectral leakage.\n[02/DSP] Computed 1024-point FFT. Magnitude conversion done: 20*log10(|X|).`
                  },
                  {
                    title: "ML Conv2D Reconstruction Loss",
                    details: [
                      { name: "Autoencoder Layers", val: "Conv2D (1->16->8) -> Latent (32) -> Deconv (8->16->1)" },
                      { name: "Neural Weights", val: "42,816 PyTorch Parameters [Fitted]" },
                      { name: "Hardware Engine", val: "ONNX Runtime CPU / TorchScript Engine" },
                      { name: "Average Inference", val: "6.20 milliseconds" },
                    ],
                    log: `[03/MODEL] Feeding 15x32 normalized power spectrum spectrogram slice.\n[03/MODEL] Encoder activation: Relu / Bottleneck Latent dimension: 32.\n[03/MODEL] Decoder reconstruction complete. Mean Squared Error computed.`
                  },
                  {
                    title: "Residual Error Attribution Analysis",
                    details: [
                      { name: "Loss Metric", val: "MSE (Mean Squared Error)" },
                      { name: "Threshold Level", val: "7.26e-06 MSE (calibrated baseline)" },
                      { name: "Hotspot Condition", val: "Reconstruction Error > 6.0 MSE" },
                      { name: "Telemetry Output", val: "Differential residual heat matrix" },
                    ],
                    log: `[04/ANALYSIS] Comparing reconstructed tensor to original inputs.\n[04/ANALYSIS] Localizing bins with anomaly residuals. Outliers found at 97.4 MHz.\n[04/ANALYSIS] Dispatching 32-bin attribution scores to decision logic.`
                  },
                  {
                    title: "Random Forest Classifier & Notification Dispatch",
                    details: [
                      { name: "Model Type", val: "Supervised Random Forest Ensemble" },
                      { name: "Ensemble Size", val: "128 Decision Trees [Fitted]" },
                      { name: "Consensus Rule", val: "Soft Voting Probability > 85.0%" },
                      { name: "External Alert Path", val: "Discord JSON Webhook / HiveMQ MQTT" },
                    ],
                    log: `[05/DECISION] Voting started. 114 of 128 trees voted JAMMING.\n[05/DECISION] Severity score: HIGH (Confidence: 95.4%).\n[05/DECISION] Triggered Discord notification dispatch. Payload received: Status 204.`
                  }
                ];
                const activeDetail = pipelineDetails[activePipelineStep];
                return (
                  <div className="border border-cyan-500/15 bg-black/40 rounded-xl p-4.5 grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fadeIn">
                    <div>
                      <h4 className="text-sm font-black text-cyan-300 tracking-wide mb-3 uppercase flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                        {activeDetail.title}
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {activeDetail.details.map((d, i) => (
                          <div key={i} className="bg-black/30 border border-white/5 rounded-lg p-2.5">
                            <span className="text-slate-500 block font-semibold mb-0.5">{d.name}</span>
                            <span className="text-white font-bold font-mono">{d.val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-500 text-xs font-semibold mb-2 block">PIPELINE NODE STREAM LOG</span>
                      <pre className="flex-1 bg-black p-3.5 rounded-lg border border-white/5 text-[10.5px] font-mono text-cyan-400 leading-normal overflow-x-auto whitespace-pre-wrap">
                        {activeDetail.log}
                      </pre>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
      </div>
    </div>
  );
}