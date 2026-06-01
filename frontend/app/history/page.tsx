"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIncidents, useHistoryMetrics } from "@/hooks/use-history";
import { Button } from "@/components/ui/button";
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
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentFrame = timeline[currentIndex] || timeline[0] || generateHistoricalFrame(0);

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
    <div className="flex min-h-screen bg-[#050816] text-white">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Topbar />

        <div className="p-12 space-y-12 overflow-y-auto flex-1">
          {/* Forensic Playback Controls Toolbar */}
          <Card className="p-8 border-cyan-500/10 bg-[#07111f] shadow-[0_0_40px_rgba(0,255,255,0.02)]">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              
              {/* Mode and Info */}
              <div className="flex items-center gap-6 shrink-0">
                <div className="flex bg-black/40 border border-cyan-500/20 rounded-xl p-1.5">
                  <button
                    onClick={() => setActiveTab("npz")}
                    className={`px-5 py-2.5 rounded-lg text-lg font-black transition-all ${
                      activeTab === "npz" ? "bg-cyan-500 text-black shadow-lg" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    NPZ REPLAY
                  </button>
                  <button
                    onClick={() => setActiveTab("csv")}
                    className={`px-5 py-2.5 rounded-lg text-lg font-black transition-all ${
                      activeTab === "csv" ? "bg-cyan-500 text-black shadow-lg" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    CSV REPLAY
                  </button>
                </div>
                <div>
                  <div className="text-slate-500 text-lg font-bold">FRAME COUNTER</div>
                  <div className="text-2xl font-black text-cyan-300 font-mono">
                    {currentIndex + 1} / {timeline.length}
                  </div>
                </div>
              </div>

              {/* Central Player Buttons */}
              <div className="flex items-center gap-5">
                <Button onClick={handleStepBackward} variant="outline" className="h-14 w-14 rounded-xl border-cyan-500/20 hover:border-cyan-400 bg-transparent text-cyan-300">
                  <SkipBack className="h-6 w-6" />
                </Button>
                
                <Button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`h-16 w-16 rounded-full flex items-center justify-center transition-all ${
                    isPlaying ? "bg-red-500 hover:bg-red-400 text-white" : "bg-cyan-500 hover:bg-cyan-400 text-black"
                  }`}
                >
                  {isPlaying ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 fill-current ml-1" />}
                </Button>

                <Button onClick={handleStepForward} variant="outline" className="h-14 w-14 rounded-xl border-cyan-500/20 hover:border-cyan-400 bg-transparent text-cyan-300">
                  <SkipForward className="h-6 w-6" />
                </Button>
              </div>

              {/* Playback Speed Controls */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <Gauge className="h-6 w-6 text-slate-500" />
                  <span className="text-slate-500 text-lg font-bold">PLAYBACK SPEED</span>
                </div>
                <div className="flex bg-black/40 border border-cyan-500/20 rounded-xl p-1">
                  {[1, 2, 5].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setPlaybackSpeed(speed)}
                      className={`h-10 px-4 rounded-lg text-base font-black transition-all ${
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
            <div className="mt-8 space-y-2">
              <div className="flex justify-between text-base text-slate-500 font-bold font-mono">
                <span>TIME: {timeline[0]?.timestamp || "00:00:00"}</span>
                <span className="text-cyan-300">CURRENT FRAME TIMESTAMP: {currentFrame.timestamp}</span>
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
                className="w-full accent-cyan-400 h-2 bg-black/40 rounded-lg appearance-none cursor-pointer border border-cyan-500/10"
              />
            </div>
          </Card>

          {/* Synchronized Replay Charts Section */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
            
            {/* Replay FFT Spectrum */}
            <Card className="p-8 border-cyan-500/10 bg-[#07111f]">
              <CardHeader className="flex flex-row items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <Activity className="h-8 w-8 text-cyan-300" />
                  <CardTitle className="text-3xl font-black">Forensic FFT Spectrum</CardTitle>
                </div>
                <div className="px-4 py-2 rounded-xl border border-cyan-500/20 bg-cyan-500/5 text-lg font-bold text-cyan-300 font-mono">
                  {currentFrame.metrics.peak_power.toFixed(1)} dBm PEAK
                </div>
              </CardHeader>
              <CardContent className="h-[420px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={currentFrame.spectrum}>
                    <defs>
                      <linearGradient id="replayFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00e5ff" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#00e5ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#16314d" strokeDasharray="3 3" />
                    <XAxis dataKey="frequency" tick={{ fill: "#6b7280", fontSize: 13 }} />
                    <YAxis domain={[-90, -10]} tick={{ fill: "#6b7280", fontSize: 13 }} />
                    <Tooltip contentStyle={{ background: "#07111f", border: "1px solid rgba(0,255,255,0.2)", color: "white" }} />
                    <Area type="monotone" dataKey="power" stroke="#22d3ee" strokeWidth={2.5} fill="url(#replayFill)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Synchronized Waterfall Heatmap Grid */}
            <Card className="p-8 border-cyan-500/10 bg-[#07111f] flex flex-col justify-between">
              <div>
                <CardHeader className="flex flex-row items-center gap-4 mb-6">
                  <Layers className="h-8 w-8 text-cyan-300" />
                  <CardTitle className="text-3xl font-black">Forensic Spectrogram</CardTitle>
                </CardHeader>
                <CardContent className="space-y-[3px] bg-black p-3 rounded-2xl border border-cyan-500/10">
                  {timeline.slice(Math.max(0, currentIndex - 15), currentIndex + 1).map((frame, rowIndex) => (
                    <div key={rowIndex} className="flex gap-[2px] h-[16px]">
                      {frame.spectrum.slice(0, 32).map((point, colIndex) => (
                        <div
                          key={colIndex}
                          className="flex-1 rounded-sm"
                          style={{
                            backgroundColor: getColor(point.power),
                            boxShadow: point.power > -35 ? "0 0 6px rgba(0,255,255,0.8)" : "none"
                          }}
                        />
                      ))}
                    </div>
                  ))}
                </CardContent>
              </div>
              <div className="flex justify-between items-center mt-6 text-slate-500 text-base font-bold">
                <span>FREQ: 88.0 MHz</span>
                <span>SPECTROGRAM ROLLING FRAME WINDOW</span>
                <span>FREQ: 108.0 MHz</span>
              </div>
            </Card>

          </div>

          {/* Historical Intelligence Analysis */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
            
            {/* Threat Event Details */}
            <Card className={`p-8 border rounded-[2rem] transition-all duration-500 ${
              currentFrame.threat.state !== "NORMAL"
                ? "bg-red-500/[0.03] border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.03)]"
                : "bg-green-500/[0.02] border-green-500/10"
            }`}>
              <CardHeader className="flex flex-row items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <AlertTriangle className={`h-9 w-9 ${currentFrame.threat.state !== "NORMAL" ? "text-red-400" : "text-green-400"}`} />
                  <CardTitle className="text-3xl font-black">Forensic Incident Context</CardTitle>
                </div>
                <div className={`px-5 py-2.5 rounded-full font-black text-lg border ${
                  currentFrame.threat.state !== "NORMAL"
                    ? "bg-red-500/10 border-red-500/30 text-red-400"
                    : "bg-green-500/10 border-green-500/20 text-green-400"
                }`}>
                  {currentFrame.threat.state}
                </div>
              </CardHeader>
              <CardContent className="space-y-6 text-xl">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <span className="text-slate-400 font-semibold">Detection Confidence</span>
                  <span className="text-white font-black font-mono">{currentFrame.threat.confidence}%</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <span className="text-slate-400 font-semibold">Incident Severity</span>
                  <span className={`font-black ${currentFrame.threat.severity === "HIGH" ? "text-red-400 animate-pulse" : "text-slate-300"}`}>
                    {currentFrame.threat.severity}
                  </span>
                </div>
                {currentFrame.threat.latency !== undefined && currentFrame.threat.latency !== null && (
                  <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <span className="text-slate-400 font-semibold">Processing Latency</span>
                    <span className="text-white font-black font-mono">{currentFrame.threat.latency.toFixed(2)} ms</span>
                  </div>
                )}
                {currentFrame.threat.min_value !== undefined && currentFrame.threat.min_value !== null && (
                  <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <span className="text-slate-400 font-semibold">SDR Power Bounds (Min/Max)</span>
                    <span className="text-white font-black font-mono">
                      {currentFrame.threat.min_value.toFixed(1)} / {currentFrame.threat.max_value?.toFixed(1) ?? "N/A"} dBm
                    </span>
                  </div>
                )}
                <div className="space-y-2">
                  <span className="text-slate-400 font-semibold block">Incident Summary Description</span>
                  <p className="text-white font-bold leading-relaxed">{currentFrame.threat.summary}</p>
                </div>
              </CardContent>
            </Card>

            {/* Signal Profile Metrics */}
            <Card className="p-8 border border-cyan-500/10 bg-[#07111f]">
              <CardHeader className="flex flex-row items-center gap-4 mb-6">
                <Sliders className="h-8 w-8 text-cyan-300" />
                <CardTitle className="text-3xl font-black">Forensic Telemetry Metrics</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-6">
                
                <div className="bg-black/40 border border-white/5 rounded-2xl p-5">
                  <span className="text-slate-500 text-base font-bold">MEAN POWER</span>
                  <div className="text-3xl font-black text-cyan-300 font-mono mt-2">{currentFrame.metrics.mean_power.toFixed(2)} dBm</div>
                </div>

                <div className="bg-black/40 border border-white/5 rounded-2xl p-5">
                  <span className="text-slate-500 text-base font-bold">PEAK POWER</span>
                  <div className="text-3xl font-black text-cyan-300 font-mono mt-2">{currentFrame.metrics.peak_power.toFixed(2)} dBm</div>
                </div>

                <div className="bg-black/40 border border-white/5 rounded-2xl p-5">
                  <span className="text-slate-500 text-base font-bold">SPECTRAL OCCUPANCY</span>
                  <div className="text-3xl font-black text-cyan-300 font-mono mt-2">{(currentFrame.metrics.occupancy * 100).toFixed(1)}%</div>
                </div>

                <div className="bg-black/40 border border-white/5 rounded-2xl p-5">
                  <span className="text-slate-500 text-base font-bold">DYNAMIC RANGE</span>
                  <div className="text-3xl font-black text-cyan-300 font-mono mt-2">{currentFrame.metrics.dynamic_range.toFixed(2)} dB</div>
                </div>

              </CardContent>
            </Card>

          </div>

        </div>
      </main>
    </div>
  );
}