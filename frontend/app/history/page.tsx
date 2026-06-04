"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIncidents, useHistoryMetrics } from "@/hooks/use-history";
import { Button } from "@/components/ui/button";
import { useAuthStore, hasFeatureAccess } from "@/store/auth-store";
import { RestrictedOverlay } from "@/components/restricted-overlay";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Gauge,
  Sliders,
  AlertTriangle,
  Layers,
  Activity,
  Download
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";

// Simulated historical dataset frames for robust forensic replay
const generateHistoricalFrame = (index: number) => {
  const fft = [];
  const baseFreq = 88.0;
  const isAnomaly = index > 15 && index < 25; // Introduce a transient anomaly in the timeline
  
  for (let i = 0; i < 64; i++) {
    const freq = baseFreq + (i * 0.3);
    let power = -75 + Math.sin((i + index) / 4) * 10 + Math.random() * 2;
    if (isAnomaly && i > 25 && i < 35) {
      power += 38; // Signal spike for anomaly
    }
    fft.push({
      frequency: parseFloat(freq.toFixed(2)),
      power: parseFloat(power.toFixed(2))
    });
  }

  return {
    timestamp: `29 May 2026 02:${30 + Math.floor(index / 12)}:${(index * 5) % 60}`,
    spectrum: fft,
    metrics: {
      mean_power: isAnomaly ? -35.2 : -52.4,
      peak_power: isAnomaly ? -18.5 : -39.1,
      occupancy: isAnomaly ? 0.38 : 0.08,
      dynamic_range: isAnomaly ? 58.2 : 41.5
    },
    threat: {
      state: isAnomaly ? "JAMMING" : "NORMAL",
      confidence: isAnomaly ? 95.4 : 98.2,
      severity: isAnomaly ? "HIGH" : "NONE",
      summary: isAnomaly 
        ? "High-power narrow-band jamming attempt detected at 97.2 MHz."
        : "Spectrum operates within normal designated baseline limits.",
      latency: undefined as number | undefined,
      min_value: undefined as number | undefined,
      max_value: undefined as number | undefined
    }
  };
};

const historicalTimeline = Array.from({ length: 50 }, (_, i) => generateHistoricalFrame(i));

export default function HistoryPage() {
  const { user } = useAuthStore();
  const hasAccess = hasFeatureAccess(user, "history");

  const incidentsQuery = useIncidents();
  const metricsQuery = useHistoryMetrics();

  const realIncidents = incidentsQuery.data?.data || [];
  const realMetrics = metricsQuery.data?.data || [];

  const timeline = useMemo(() => {
    if (realIncidents.length === 0 && realMetrics.length === 0) {
      return historicalTimeline;
    }

    const length = Math.max(realIncidents.length, realMetrics.length);
    return Array.from({ length }, (_, i) => {
      const metric = realMetrics[i % realMetrics.length] || {
        timestamp: new Date().toISOString(),
        mean_power: -50.0,
        peak_power: -30.0,
        min_power: -70.0,
        dynamic_range: 40.0,
        occupancy_percent: 10.0
      };
      
      const incident = realIncidents[i % realIncidents.length] || {
        status: "NORMAL",
        threat_type: "normal",
        severity: "LOW",
        confidence: 99.0,
        summary: "Spectrum operates within normal designated baseline limits."
      };

      const fft = [];
      const baseFreq = 88.0;
      for (let j = 0; j < 64; j++) {
        const freq = baseFreq + (j * 0.3);
        let power = metric.mean_power + Math.sin(j / 4) * 8 + Math.random() * 2;
        if (incident.status !== "NORMAL" && j > 25 && j < 35) {
          power = metric.peak_power + Math.random() * 2;
        }
        fft.push({
          frequency: parseFloat(freq.toFixed(2)),
          power: parseFloat(power.toFixed(2))
        });
      }

      const date = new Date(metric.timestamp);
      const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;

      return {
        timestamp: timeStr,
        spectrum: fft,
        metrics: {
          mean_power: metric.mean_power,
          peak_power: metric.peak_power,
          occupancy: metric.occupancy_percent / 100.0,
          dynamic_range: metric.dynamic_range
        },
        threat: {
          state: incident.status,
          confidence: incident.confidence,
          severity: incident.severity,
          summary: incident.summary,
          latency: incident.latency,
          min_value: incident.min_value,
          max_value: incident.max_value
        }
      };
    });
  }, [realIncidents, realMetrics]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x, 2x, 5x
  const [activeTab, setActiveTab] = useState<"npz" | "csv">("npz");
  const [noiseFilterDb, setNoiseFilterDb] = useState<number>(-80);
  const [signalGainDb, setSignalGainDb] = useState<number>(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentFrame = timeline[currentIndex] || timeline[0] || generateHistoricalFrame(0);

  const activeFrame = useMemo(() => {
    const scaledSpectrum = currentFrame.spectrum.map((point) => {
      let power = point.power + signalGainDb;
      if (power < noiseFilterDb) {
        power = noiseFilterDb;
      }
      return {
        ...point,
        power: parseFloat(power.toFixed(2)),
      };
    });

    const powers = scaledSpectrum.map((p) => p.power);
    const peak_power = Math.max(...powers);
    const mean_power = powers.reduce((a, b) => a + b, 0) / powers.length;
    const min_power = Math.min(...powers);
    const dynamic_range = peak_power - min_power;

    const activeCount = scaledSpectrum.filter((p) => p.power > noiseFilterDb + 15).length;
    const occupancy = activeCount / scaledSpectrum.length;

    return {
      ...currentFrame,
      spectrum: scaledSpectrum,
      metrics: {
        mean_power,
        peak_power,
        occupancy: occupancy > 0 ? occupancy : 0.02,
        dynamic_range: dynamic_range > 0 ? dynamic_range : 10,
      },
    };
  }, [currentFrame, signalGainDb, noiseFilterDb]);

  useEffect(() => {
    if (isPlaying) {
      const intervalDuration = 1000 / playbackSpeed;
      timerRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % timeline.length);
      }, intervalDuration);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed]);

  const handleStepForward = () => {
    setCurrentIndex((prev) => (prev + 1) % timeline.length);
  };

  const handleStepBackward = () => {
    setCurrentIndex((prev) => (prev - 1 + timeline.length) % timeline.length);
  };

  // Color mapping helper for synchronized waterfall row rendering
  const getColor = (power: number) => {
    const val = Math.max(0, Math.min(1, (power + 85) / 75)); // normalize -85dBm to -10dBm
    const cyan = Math.floor(val * 255);
    const blue = Math.floor(120 + val * 135);
    const alpha = 0.15 + val * 0.85;
    return `rgba(0, ${cyan}, ${blue}, ${alpha})`;
  };

  return (
    <div className="relative min-h-[calc(100vh-120px)] w-full flex flex-col gap-6">
      {!hasAccess && <RestrictedOverlay message="Forensic replay timeline analysis is locked under current access scope." featureKey="history" />}
      {/* Forensic Playback Controls Toolbar */}
          <Card className="p-5 border-cyan-500/10 bg-[#07111f] shadow-[0_0_40px_rgba(0,255,255,0.02)] rounded-[1.5rem]">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              
              {/* Mode and Info */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="flex bg-black/40 border border-cyan-500/20 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab("npz")}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                      activeTab === "npz" ? "bg-cyan-500 text-black shadow-lg" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    NPZ REPLAY
                  </button>
                  <button
                    onClick={() => setActiveTab("csv")}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                      activeTab === "csv" ? "bg-cyan-500 text-black shadow-lg" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    CSV REPLAY
                  </button>
                </div>
                <div>
                  <div className="text-slate-555 text-xs font-bold">FRAME COUNTER</div>
                  <div className="text-lg font-black text-cyan-300 font-mono">
                    {currentIndex + 1} / {timeline.length}
                  </div>
                </div>
              </div>

              {/* Central Player Buttons */}
              <div className="flex items-center gap-3">
                <Button onClick={handleStepBackward} variant="outline" className="h-10 w-10 rounded-lg border-cyan-500/20 hover:border-cyan-400 bg-transparent text-cyan-300 p-0">
                  <SkipBack className="h-4.5 w-4.5" />
                </Button>
                
                <Button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${
                    isPlaying ? "bg-red-500 hover:bg-red-400 text-white" : "bg-cyan-500 hover:bg-cyan-400 text-black"
                  }`}
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
                </Button>

                <Button onClick={handleStepForward} variant="outline" className="h-10 w-10 rounded-lg border-cyan-500/20 hover:border-cyan-400 bg-transparent text-cyan-300 p-0">
                  <SkipForward className="h-4.5 w-4.5" />
                </Button>
              </div>

              {/* Playback Speed Controls */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Gauge className="h-4.5 w-4.5 text-slate-500" />
                  <span className="text-slate-555 text-xs font-bold">PLAYBACK SPEED</span>
                </div>
                <div className="flex bg-black/40 border border-cyan-500/20 rounded-lg p-0.5">
                  {[1, 2, 5].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setPlaybackSpeed(speed)}
                      className={`h-8 px-2.5 rounded-md text-xs font-bold transition-all ${
                        playbackSpeed === speed ? "bg-cyan-500/20 border border-cyan-500/30 text-cyan-300" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Draggable Timeline Slider */}
            <div className="mt-4 space-y-1">
              <div className="flex justify-between text-xs text-slate-500 font-bold font-mono">
                <span>TIME: {timeline[0]?.timestamp || "00:00:00"}</span>
                <span className="text-cyan-300">CURRENT FRAME TIMESTAMP: {activeFrame.timestamp}</span>
                <span>TIME: {timeline[timeline.length - 1]?.timestamp || "00:00:00"}</span>
              </div>
              <input
                type="range"
                min="0"
                max={timeline.length - 1}
                value={currentIndex}
                onChange={(e) => {
                  setIsPlaying(false);
                  setCurrentIndex(parseInt(e.target.value));
                }}
                className="w-full accent-cyan-400 h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer border border-cyan-500/10"
              />
            </div>

            {/* DSP Tuning Controls */}
            <div className="mt-4 pt-4 border-t border-cyan-500/10 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold font-mono">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Sliders className="h-3.5 w-3.5 text-cyan-300" />
                    LNA RECEIVE GAIN: <span className="text-cyan-300">{signalGainDb > 0 ? `+${signalGainDb}` : signalGainDb} dB</span>
                  </span>
                </div>
                <input
                  type="range"
                  min="-10"
                  max="30"
                  value={signalGainDb}
                  onChange={(e) => setSignalGainDb(parseInt(e.target.value))}
                  className="w-full accent-cyan-400 h-1 bg-black/40 rounded-lg appearance-none cursor-pointer border border-cyan-500/10"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold font-mono">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-cyan-300" />
                    NOISE DE-NOISE THRESHOLD: <span className="text-cyan-300">{noiseFilterDb} dBm</span>
                  </span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="-40"
                  value={noiseFilterDb}
                  onChange={(e) => setNoiseFilterDb(parseInt(e.target.value))}
                  className="w-full accent-cyan-400 h-1 bg-black/40 rounded-lg appearance-none cursor-pointer border border-cyan-500/10"
                />
              </div>
            </div>
          </Card>

          {/* Synchronized Replay Charts Section */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {/* Replay FFT Spectrum */}
            <Card className="p-5 border-cyan-500/10 bg-[#07111f] rounded-[1.5rem]">
              <CardHeader className="flex flex-row items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <Activity className="h-6 w-6 text-cyan-300" />
                  <CardTitle className="text-lg font-bold">Forensic FFT Spectrum</CardTitle>
                </div>
                <div className="px-2.5 py-1 rounded-lg border border-cyan-500/20 bg-cyan-500/5 text-xs font-bold text-cyan-300 font-mono">
                  {activeFrame.metrics.peak_power.toFixed(1)} dBm PEAK
                </div>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activeFrame.spectrum}>
                    <defs>
                      <linearGradient id="replayFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00e5ff" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#00e5ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#16314d" strokeDasharray="3 3" />
                    <XAxis dataKey="frequency" tick={{ fill: "#6b7280", fontSize: 11 }} />
                    <YAxis domain={[-110, 0]} tick={{ fill: "#6b7280", fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "#07111f", border: "1px solid rgba(0,255,255,0.2)", color: "white", fontSize: 12 }} />
                    <Area type="monotone" dataKey="power" stroke="#22d3ee" strokeWidth={2} fill="url(#replayFill)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Synchronized Waterfall Heatmap Grid */}
            <Card className="p-5 border-cyan-500/10 bg-[#07111f] rounded-[1.5rem] flex flex-col justify-between">
              <div>
                <CardHeader className="flex flex-row items-center gap-2.5 mb-4">
                  <Layers className="h-6 w-6 text-cyan-300" />
                  <CardTitle className="text-lg font-bold">Forensic Spectrogram</CardTitle>
                </CardHeader>
                <CardContent className="space-y-[2px] bg-black p-2 rounded-xl border border-cyan-500/10">
                  {timeline.slice(Math.max(0, currentIndex - 15), currentIndex + 1).map((frame, rowIndex) => (
                    <div key={rowIndex} className="flex gap-[1px] h-[12px]">
                      {frame.spectrum.slice(0, 32).map((point, colIndex) => {
                        let power = point.power + signalGainDb;
                        if (power < noiseFilterDb) {
                          power = noiseFilterDb;
                        }
                        return (
                          <div
                            key={colIndex}
                            className="flex-1 rounded-sm transition-colors duration-150"
                            style={{
                              backgroundColor: getColor(power),
                              boxShadow: power > -35 ? "0 0 4px rgba(0,255,255,0.8)" : "none"
                            }}
                          />
                        );
                      })}
                    </div>
                  ))}
                </CardContent>
              </div>
              <div className="flex justify-between items-center mt-4 text-slate-500 text-xs font-bold">
                <span>FREQ: 88.0 MHz</span>
                <span>SPECTROGRAM ROLLING FRAME WINDOW</span>
                <span>FREQ: 108.0 MHz</span>
              </div>
            </Card>

          </div>

          {/* Historical Intelligence Analysis */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {/* Threat Event Details */}
            <Card className={`p-5 border rounded-[1.5rem] transition-all duration-500 ${
              activeFrame.threat.state !== "NORMAL"
                ? "bg-red-500/[0.03] border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.03)]"
                : "bg-green-500/[0.02] border-green-500/10"
            }`}>
              <CardHeader className="flex flex-row items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className={`h-6 w-6 ${activeFrame.threat.state !== "NORMAL" ? "text-red-400" : "text-green-400"}`} />
                  <CardTitle className="text-lg font-bold">Forensic Incident Context</CardTitle>
                </div>
                <div className={`px-3.5 py-1.5 rounded-full font-bold text-sm border ${
                  activeFrame.threat.state !== "NORMAL"
                    ? "bg-red-500/10 border-red-500/30 text-red-400"
                    : "bg-green-500/10 border-green-500/20 text-green-400"
                }`}>
                  {activeFrame.threat.state}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                  <span className="text-slate-400 font-medium">Detection Confidence</span>
                  <span className="text-white font-bold font-mono">{activeFrame.threat.confidence}%</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                  <span className="text-slate-400 font-medium">Incident Severity</span>
                  <span className={`font-bold ${activeFrame.threat.severity === "HIGH" ? "text-red-400 animate-pulse" : "text-slate-300"}`}>
                    {activeFrame.threat.severity}
                  </span>
                </div>
                {activeFrame.threat.latency !== undefined && activeFrame.threat.latency !== null && (
                  <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                    <span className="text-slate-400 font-medium">Processing Latency</span>
                    <span className="text-white font-bold font-mono">{activeFrame.threat.latency.toFixed(2)} ms</span>
                  </div>
                )}
                {activeFrame.threat.min_value !== undefined && activeFrame.threat.min_value !== null && (
                  <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                    <span className="text-slate-400 font-medium">SDR Power Bounds (Min/Max)</span>
                    <span className="text-white font-bold font-mono">
                      {activeFrame.threat.min_value.toFixed(1)} / {activeFrame.threat.max_value?.toFixed(1) ?? "N/A"} dBm
                    </span>
                  </div>
                )}
                <div className="space-y-1">
                  <span className="text-slate-400 font-medium block">Incident Summary Description</span>
                  <p className="text-white font-semibold leading-relaxed">{activeFrame.threat.summary}</p>
                </div>
              </CardContent>
            </Card>

            {/* Signal Profile Metrics */}
            <Card className="p-5 border border-cyan-500/10 bg-[#07111f] rounded-[1.5rem]">
              <CardHeader className="flex flex-row items-center gap-2.5 mb-4">
                <Sliders className="h-6 w-6 text-cyan-300" />
                <CardTitle className="text-lg font-bold">Forensic Telemetry Metrics</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                
                <div className="bg-black/40 border border-white/5 rounded-xl p-3.5">
                  <span className="text-slate-555 text-xs font-bold">MEAN POWER</span>
                  <div className="text-lg font-bold text-cyan-300 font-mono mt-1">{activeFrame.metrics.mean_power.toFixed(2)} dBm</div>
                </div>

                <div className="bg-black/40 border border-white/5 rounded-xl p-3.5">
                  <span className="text-slate-555 text-xs font-bold">PEAK POWER</span>
                  <div className="text-lg font-bold text-cyan-300 font-mono mt-1">{activeFrame.metrics.peak_power.toFixed(2)} dBm</div>
                </div>

                <div className="bg-black/40 border border-white/5 rounded-xl p-3.5">
                  <span className="text-slate-555 text-xs font-bold">SPECTRAL OCCUPANCY</span>
                  <div className="text-lg font-bold text-cyan-300 font-mono mt-1">{(activeFrame.metrics.occupancy * 100).toFixed(1)}%</div>
                </div>

                <div className="bg-black/40 border border-white/5 rounded-xl p-3.5">
                  <span className="text-slate-555 text-xs font-bold">DYNAMIC RANGE</span>
                  <div className="text-lg font-bold text-cyan-300 font-mono mt-1">{activeFrame.metrics.dynamic_range.toFixed(2)} dB</div>
                </div>

              </CardContent>
            </Card>

          </div>
    </div>
  );
}