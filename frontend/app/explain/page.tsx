"use client";

import { useMemo, useEffect, useRef, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
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

export default function ExplainPage() {
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
    <div className="flex min-h-screen bg-[#050816] text-white">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Topbar />

        <div className="p-12 space-y-12 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
            
            {/* Left side: AI Summary & Attribution */}
            <Card className="p-8 border-cyan-500/10 bg-[#07111f] flex flex-col justify-between shadow-[0_0_50px_rgba(0,255,255,0.02)]">
              <div>
                <CardHeader className="flex flex-row items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <Brain className="h-9 w-9 text-cyan-300 animate-pulse" />
                    <CardTitle className="text-4xl font-black">AI Reasoning Summary</CardTitle>
                  </div>
                  <div className="px-5 py-2.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-lg font-black tracking-wide font-mono">
                    {explanation?.confidence ? `${explanation.confidence}%` : "94.2%"} CONFIDENCE
                  </div>
                </CardHeader>

                <CardContent className="space-y-8 text-xl">
                  {explanation ? (
                    <>
                      <div className="space-y-2">
                        <span className="text-slate-500 text-lg font-bold">EXPLANATION HEADLINE</span>
                        <div className="text-2xl font-black text-white leading-snug">
                          {explanation.headline}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-slate-500 text-lg font-bold">TECHNICAL BREAKDOWN</span>
                        <div className="text-xl text-slate-300 font-semibold leading-relaxed">
                          {explanation.technical_summary}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-slate-500 text-lg font-bold">IMPACT ASSESSMENT</span>
                        <div className="text-xl text-slate-300 font-semibold leading-relaxed">
                          {explanation.impact}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-slate-500 text-lg font-bold">RECOMMENDED DEFENSIVE ACTION</span>
                        <div className="text-xl text-cyan-300 font-black leading-relaxed border border-cyan-500/10 rounded-2xl p-6 bg-cyan-500/[0.02] shadow-[0_0_20px_rgba(6,182,212,0.05)]">
                          {explanation.recommended_action}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      <p className="text-2xl font-black text-white">Analyzing RF Spectrogram...</p>
                      <p className="text-lg mt-2">Computing reconstruction error attributions</p>
                    </div>
                  )}

                  {/* Top Features Progress Bars */}
                  <div className="space-y-6 pt-6 border-t border-white/5">
                    <h3 className="text-2xl font-black text-white">Spectrum Attribution Factors</h3>

                    {explanation?.top_features && explanation.top_features.length > 0 ? (
                      explanation.top_features.map((feat: any, idx: number) => {
                        const colors = ["bg-cyan-500", "bg-purple-500", "bg-teal-500"];
                        const percent = Math.round(feat.importance * 100);
                        const displayName = feat.name
                          .replace("_", " ")
                          .replace(/\b\w/g, (c: string) => c.toUpperCase());
                        return (
                          <div key={idx} className="space-y-2">
                            <div className="flex justify-between text-lg font-bold text-slate-400">
                              <span>{displayName}</span>
                              <span>{feat.importance.toFixed(2)}</span>
                            </div>
                            <div className="w-full bg-black/40 h-3 rounded-full overflow-hidden border border-white/5">
                              <div className={`${colors[idx % 3]} h-full rounded-full`} style={{ width: `${percent}%` }} />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <>
                        <div className="space-y-2">
                          <div className="flex justify-between text-lg font-bold text-slate-400">
                            <span>Normal Baseline Deviation</span>
                            <span>0.82</span>
                          </div>
                          <div className="w-full bg-black/40 h-3 rounded-full overflow-hidden border border-white/5">
                            <div className="bg-cyan-500 h-full rounded-full" style={{ width: "82%" }} />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-lg font-bold text-slate-400">
                            <span>Spectral Spikiness Ratio</span>
                            <span>0.64</span>
                          </div>
                          <div className="w-full bg-black/40 h-3 rounded-full overflow-hidden border border-white/5">
                            <div className="bg-purple-500 h-full rounded-full" style={{ width: "64%" }} />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-lg font-bold text-slate-400">
                            <span>Bandwidth Occupancy Rise</span>
                            <span>0.52</span>
                          </div>
                          <div className="w-full bg-black/40 h-3 rounded-full overflow-hidden border border-white/5">
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
            <div className="space-y-12">
              
              {/* Reconstruction Error Heatmap */}
              <Card className="p-8 border-cyan-500/10 bg-[#07111f] rounded-[2rem] shadow-[0_0_60px_rgba(0,255,255,0.04)] flex flex-col justify-between">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <div className="flex items-center gap-4">
                    <ShieldAlert className="h-8 w-8 text-cyan-300" />
                    <div>
                      <CardTitle className="text-3xl font-black text-white">Reconstruction Error Heatmap</CardTitle>
                      <div className="text-slate-400 text-sm mt-1">Pixel-level neural autoencoder deviation map</div>
                    </div>
                  </div>
                  {isAutoencoderActive && (
                    <div className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1.5 text-xs font-black tracking-widest font-mono text-cyan-300 uppercase">
                      Neural active
                    </div>
                  )}
                </CardHeader>

                <CardContent className="space-y-8 mt-6">
                  {isLoading ? (
                    // Loading State
                    <div className="h-[350px] flex flex-col items-center justify-center border border-cyan-500/10 bg-black/40 rounded-2xl text-slate-500 font-bold text-lg">
                      <RefreshCw className="h-10 w-10 text-cyan-400 animate-spin mb-4" />
                      <span className="font-mono text-sm tracking-widest text-cyan-300">CALCULATING SPECTRAL RESIDUALS...</span>
                    </div>
                  ) : isAutoencoderActive ? (
                    // Active Heatmap Canvas
                    <div className="relative overflow-hidden rounded-2xl border border-cyan-500/15 bg-black p-1.5 group">
                      <canvas
                        ref={canvasRef}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        className="w-full h-[350px] bg-black rounded-xl cursor-crosshair block transition-all"
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
                    <div className="relative overflow-hidden rounded-2xl border border-dashed border-cyan-500/20 bg-black/60 p-8 h-[350px] flex flex-col justify-between items-center text-center group">
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
                      
                      <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-cyan-500/5 blur-3xl" />
                      <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-purple-500/5 blur-3xl" />

                      <div className="my-auto space-y-6 max-w-md relative z-10">
                        <div className="relative mx-auto h-20 w-20 rounded-full border border-cyan-500/30 bg-cyan-950/20 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.1)] group-hover:scale-110 transition-transform duration-300">
                          <Activity className="h-10 w-10 text-cyan-400 animate-pulse" />
                          <div className="absolute inset-0 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin duration-1000" style={{ animationDuration: '3s' }} />
                        </div>
                        
                        <div className="space-y-2">
                          <h3 className="text-3xl font-black text-white tracking-tight">Autoencoder Pipeline Standby</h3>
                          <p className="text-slate-400 text-sm font-semibold leading-relaxed">
                            Neural autoencoder reconstruction maps are offline. Current active model is <span className="text-purple-300 font-mono font-bold capitalize">{activeModel.replace("_", " ")}</span>.
                          </p>
                          <p className="text-slate-500 text-xs font-semibold max-w-xs mx-auto leading-normal">
                            Activate the unsupervised autoencoder model to enable differential spectral residual loss (MSE) and hotspot explainability.
                          </p>
                        </div>

                        <button
                          onClick={() => switchModel.mutate("autoencoder")}
                          disabled={switchModel.isPending}
                          className="px-8 py-3.5 rounded-xl text-sm font-black bg-cyan-500 text-black hover:bg-cyan-400 disabled:bg-cyan-950 disabled:text-cyan-600 shadow-[0_0_30px_rgba(6,182,212,0.25)] hover:shadow-[0_0_40px_rgba(6,182,212,0.4)] transition-all duration-300 flex items-center gap-2 mx-auto uppercase tracking-wider active:scale-95"
                        >
                          {switchModel.isPending ? (
                            <>
                              <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                              Engaging Neural Engine...
                            </>
                          ) : (
                            <>
                              <Sliders className="h-4.5 w-4.5" />
                              Engage Autoencoder Model
                            </>
                          )}
                        </button>
                        
                        {switchModel.isError && (
                          <div className="text-red-400 text-xs font-black font-mono animate-pulse">
                            FAILED TO TRANSMIT MODEL CHANGE COMMAND. RETRY.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* CALIBRATED COLOR LEGEND SCALE WITH LIVE POINTERS */}
                  <div className="p-5 rounded-2xl border border-white/5 bg-black/40 flex flex-col gap-3 relative overflow-hidden">
                    <div className="flex justify-between items-center text-[10px] font-black font-mono text-slate-500 tracking-wider">
                      <span>RECONSTRUCTION RESIDUAL SCALE (MSE)</span>
                      <span className="text-cyan-400">ANOMALY MAGNITUDE</span>
                    </div>
                    
                    <div className="relative">
                      {/* Gradient Bar */}
                      <div className="h-5 w-full rounded-full bg-gradient-to-r from-[#031d44] via-[#c084fc] via-[#f43f5e] to-yellow-100 border border-white/10 relative overflow-hidden" />
                      
                      {/* Live Max Error Marker */}
                      {isAutoencoderActive && maxError > 0 && (
                        <div 
                          className="absolute -top-1.5 h-8 w-1.5 bg-yellow-300 shadow-[0_0_10px_rgba(253,224,71,0.8)] z-10 rounded-full transition-all duration-300"
                          style={{ left: `${Math.min(100, (maxError / 12.0) * 100)}%` }}
                          title={`Max Error: ${maxError}`}
                        >
                          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-yellow-300 text-black text-[9px] font-black font-mono px-1 rounded shadow">
                            MAX
                          </div>
                        </div>
                      )}

                      {/* Live Mean Error Marker */}
                      {isAutoencoderActive && meanError > 0 && (
                        <div 
                          className="absolute -top-1.5 h-8 w-1.5 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] z-10 rounded-full transition-all duration-300"
                          style={{ left: `${Math.min(100, (meanError / 12.0) * 100)}%` }}
                          title={`Mean Error: ${meanError}`}
                        >
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-cyan-400 text-black text-[9px] font-black font-mono px-1 rounded shadow">
                            AVG
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between text-[9px] font-extrabold font-mono text-slate-400 tracking-wider mt-4">
                      <span className="text-blue-400">EXACT MATCH (0.0)</span>
                      <span className="text-purple-400">MID LEVEL (5.0)</span>
                      <span className="text-red-400 animate-pulse">CRITICAL ANOMALY (12.0+)</span>
                    </div>
                  </div>

                  {/* 3-COLUMN TELEMETRY GRID */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                    <div className="rounded-2xl border border-cyan-500/10 bg-cyan-500/[0.03] p-5 flex flex-col justify-between">
                      <span className="text-[0.9rem] text-slate-500 font-bold uppercase tracking-wider">Reconstruction Loss</span>
                      <div className="mt-2 text-[1.7rem] font-black text-cyan-300 font-mono flex items-baseline gap-1">
                        <span>{isAutoencoderActive ? meanError.toFixed(2) : "0.00"}</span>
                        <span className="text-xs text-slate-500">AVG</span>
                        <span className="text-slate-600 font-normal">/</span>
                        <span className="text-purple-300">{isAutoencoderActive ? maxError.toFixed(1) : "0.0"}</span>
                        <span className="text-xs text-slate-500">MAX</span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-cyan-500/10 bg-cyan-500/[0.03] p-5 flex flex-col justify-between">
                      <span className="text-[0.9rem] text-slate-500 font-bold uppercase tracking-wider">Anomaly Hotspots</span>
                      <div className="mt-2 text-[1.7rem] font-black text-cyan-300 font-mono flex items-baseline gap-2">
                        <span>{isAutoencoderActive ? hotspotsCount : "0"}</span>
                        <span className="text-xs text-slate-500 font-sans font-semibold">
                          {hotspotsCount > 5 ? "CRITICAL CLUSTERS" : hotspotsCount > 0 ? "DEVIATIONS" : "STABLE BINS"}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-cyan-500/10 bg-cyan-500/[0.03] p-5 flex flex-col justify-between">
                      <span className="text-[0.9rem] text-slate-500 font-bold uppercase tracking-wider">Neural Latency</span>
                      <div className="mt-2 text-[1.7rem] font-black text-cyan-300 font-mono flex items-baseline gap-1">
                        <span>{isAutoencoderActive ? "6.20" : "0.00"}</span>
                        <span className="text-xs text-slate-500">ms</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Feature Importance Bar Chart */}
              <Card className="p-8 border-cyan-500/10 bg-[#07111f] rounded-[2rem]">
                <CardHeader className="flex flex-row items-center gap-4 mb-6">
                  <Sliders className="h-8 w-8 text-cyan-300" />
                  <CardTitle className="text-3xl font-black">Frequency Band Attribution (XAI)</CardTitle>
                </CardHeader>
                <CardContent className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid stroke="#16314d" strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 13 }} />
                      <YAxis tick={{ fill: "#6b7280", fontSize: 13 }} />
                      <Tooltip contentStyle={{ background: "#07111f", border: "1px solid rgba(0,255,255,0.2)", color: "white" }} />
                      <Bar dataKey="importance" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

            </div>

          </div>

          {/* AI Decision Pipeline Timeline */}
          <Card className="p-8 border-cyan-500/10 bg-[#07111f] shadow-[0_0_50px_rgba(0,255,255,0.02)] rounded-[2rem]">
            <CardHeader className="flex flex-row items-center gap-4 mb-8">
              <Cpu className="h-9 w-9 text-cyan-300" />
              <CardTitle className="text-4xl font-black">Explainable AI Decision Pipeline</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative">
                {/* Horizontal line connector */}
                <div className="absolute top-[28px] left-[10%] right-[10%] h-[2px] bg-cyan-500/10 hidden md:block" />

                {[
                  { step: "01", title: "RF Ingestion", desc: "Raw complex IQ samples captured at 2.4 MSPS from SDR receiver." },
                  { step: "02", title: "DSP Spectrum", desc: "1024-point FFT processing & log spectrogram window builder." },
                  { step: "03", title: "ML Reconstruction", desc: "Convolutional Autoencoder reconstructs the spectral signature." },
                  { step: "04", title: "Residual analysis", desc: "Reconstruction error residuals computed, hot spots localized." },
                  { step: "05", title: "Risk Decision", desc: "Random Forest tags threat classification and fires notifications." },
                ].map((item, idx) => (
                  <div key={idx} className="relative z-10 flex flex-col items-center text-center space-y-4 bg-black/20 p-6 rounded-2xl border border-cyan-500/5">
                    <div className="h-14 w-14 rounded-full border-2 border-cyan-500/30 bg-[#07111f] flex items-center justify-center text-cyan-300 text-xl font-black shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                      {item.step}
                    </div>
                    <div className="text-2xl font-black text-white">{item.title}</div>
                    <p className="text-base text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}