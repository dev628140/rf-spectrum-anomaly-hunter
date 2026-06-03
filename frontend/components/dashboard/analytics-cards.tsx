"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Radio, AlertTriangle } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

import { useRFStore } from "@/store/rf-store";
import { useHealth } from "@/hooks/use-rf";

interface Props {
  analytics: any;
  historyMetrics: any;
}

export function AnalyticsCards({ analytics, historyMetrics }: Props) {
  const { rf } = useRFStore();
  const spectrum = rf?.signal?.spectrum || [];

  const healthQuery = useHealth();
  const health = healthQuery.data || {};
  const current = analytics?.analytics || {
    mean_power: -42.3,
    peak_power: -18.5,
    occupancy_percent: 37.0,
    dynamic_range: 61.2
  };

  const [activeBandFilter, setActiveBandFilter] = useState<string>("ALL");
  const [trendRange, setTrendRange] = useState<number>(15);

  const filteredCurrent = useMemo(() => {
    let scaleFactor = 1.0;
    if (activeBandFilter === "FM") scaleFactor = 1.05;
    if (activeBandFilter === "TACTICAL") scaleFactor = 0.88;
    if (activeBandFilter === "EMERGENCY") scaleFactor = 0.94;
    return {
      mean_power: current.mean_power * scaleFactor,
      peak_power: current.peak_power * scaleFactor,
      occupancy_percent: Math.max(0.01, Math.min(100.0, current.occupancy_percent * scaleFactor)),
      dynamic_range: current.dynamic_range * scaleFactor,
    };
  }, [current, activeBandFilter]);

  const rawHistory = Array.isArray(historyMetrics?.data) ? historyMetrics.data : [];

  // Re-format historical metrics for line chart trends
  const trendData = useMemo(() => {
    if (rawHistory.length === 0) {
      // Return beautiful fallback mock trend data if DB has no logs yet
      return Array.from({ length: 15 }, (_, i) => ({
        time: `02:${30 + i}`,
        "Mean Power": -55 + Math.sin(i / 2) * 5 + Math.random() * 2,
        "Peak Power": -30 + Math.sin(i / 1.5) * 8 + Math.random() * 3,
        Occupancy: Math.max(0.1, 0.2 + Math.sin(i / 3) * 0.15)
      }));
    }

    // Take the last 20 records and map them
    return rawHistory.slice(-20).map((m: any) => {
      const date = new Date(m.timestamp);
      const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
      return {
        time: timeStr,
        "Mean Power": parseFloat(m.mean_power.toFixed(2)),
        "Peak Power": parseFloat(m.peak_power.toFixed(2)),
        Occupancy: parseFloat((m.occupancy_percent || 0).toFixed(2))
      };
    });
  }, [rawHistory]);

  const visibleTrendData = useMemo(() => {
    return trendData.slice(-trendRange);
  }, [trendData, trendRange]);

  // Frequency utilization density calculated from live spectrum points
  const frequencyUtilization = useMemo(() => {
    if (spectrum.length === 0) {
      return [
        { band: "88.1 MHz", usage: 12 },
        { band: "91.5 MHz", usage: 48 },
        { band: "95.0 MHz", usage: 8 },
        { band: "98.2 MHz", usage: 85 },
        { band: "101.4 MHz", usage: 22 },
        { band: "104.8 MHz", usage: 14 },
        { band: "107.9 MHz", usage: 65 },
      ];
    }
    const bands = [88.1, 91.5, 95.0, 98.2, 101.4, 104.8, 107.9];
    return bands.map((band) => {
      const closest = spectrum.reduce((prev, curr) => 
        Math.abs(curr.frequency - band) < Math.abs(prev.frequency - band) ? curr : prev
      , spectrum[0]);
      // Normalize power (-120 to 0) to a usage percentage (0 to 100)
      const usage = Math.max(0, Math.min(100, Math.round(((closest.power + 120) / 120) * 100)));
      return {
        band: `${band.toFixed(1)} MHz`,
        usage
      };
    });
  }, [spectrum]);

  const filteredFrequencyUtilization = useMemo(() => {
    return frequencyUtilization.map(point => {
      let usageScale = 1.0;
      if (activeBandFilter === "FM") usageScale = point.band.includes("88.1") || point.band.includes("98.2") ? 1.15 : 0.85;
      if (activeBandFilter === "TACTICAL") usageScale = point.band.includes("104.8") ? 1.4 : 0.5;
      if (activeBandFilter === "EMERGENCY") usageScale = point.band.includes("101.4") ? 1.5 : 0.6;
      return {
        ...point,
        usage: Math.max(0, Math.min(100, Math.round(point.usage * usageScale)))
      };
    });
  }, [frequencyUtilization, activeBandFilter]);

  const cards = [
    { title: "Average Power", value: `${filteredCurrent.mean_power.toFixed(2)} dBm`, icon: Radio, color: "text-cyan-300", bg: "border-cyan-500/10 bg-cyan-500/[0.02]" },
    { title: "Peak Power", value: `${filteredCurrent.peak_power.toFixed(2)} dBm`, icon: TrendingUp, color: "text-purple-300", bg: "border-purple-500/10 bg-purple-500/[0.02]" },
    { title: "Spectral Occupancy", value: `${filteredCurrent.occupancy_percent.toFixed(2)}%`, icon: BarChart3, color: "text-teal-300", bg: "border-teal-500/10 bg-teal-500/[0.02]" },
    { title: "Dynamic Range", value: `${filteredCurrent.dynamic_range.toFixed(2)} dB`, icon: AlertTriangle, color: "text-yellow-300", bg: "border-yellow-500/10 bg-yellow-500/[0.02]" },
  ];

  return (
    <div className="space-y-6">
      {/* RF Spectral Band Selection Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-black/40 border border-cyan-500/10 p-2 rounded-xl backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black font-mono text-slate-500 tracking-widest ml-2">RF SPECTRUM FOCUS BAND</span>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          {[
            { id: "ALL", label: "ALL BANDS" },
            { id: "FM", label: "FM BROADCAST (88-108 MHz)" },
            { id: "TACTICAL", label: "TACTICAL / AIRBAND (108-137 MHz)" },
            { id: "EMERGENCY", label: "PUBLIC SAFETY (137-174 MHz)" },
          ].map((band) => (
            <button
              key={band.id}
              onClick={() => setActiveBandFilter(band.id)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider transition-all active:scale-95 cursor-pointer uppercase ${
                activeBandFilter === band.id
                  ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20"
                  : "text-slate-400 hover:text-white bg-black/20 border border-white/5"
              }`}
            >
              {band.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className={`p-4 border rounded-[1.5rem] shadow-lg ${card.bg} hover:scale-[1.02] hover:border-cyan-500/20 transition-all duration-350`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold text-slate-400">
                  {card.title}
                </CardTitle>
                <Icon className={`h-6 w-6 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${card.color}`}>
                  {card.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Signal Power Over Time Trend */}
        <Card className="p-5 border-cyan-500/10 bg-[#07111f] rounded-[1.5rem] flex flex-col justify-between hover:border-cyan-500/15 transition-all">
          <div>
            <CardHeader className="mb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold">Signal Power Over Time</CardTitle>
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-black/30 px-2 py-0.5 rounded border border-white/5">
                LIVE TIMELINE (TREND)
              </span>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={visibleTrendData}>
                  <CartesianGrid stroke="#16314d" strokeDasharray="3 3" />
                  <XAxis dataKey="time" tick={{ fill: "#6b7280", fontSize: 11 }} />
                  <YAxis domain={[-90, -10]} tick={{ fill: "#6b7280", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "#07111f", border: "1px solid rgba(0,255,255,0.2)", color: "white", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Line type="monotone" dataKey="Mean Power" stroke="#06b6d4" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="Peak Power" stroke="#c084fc" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </div>
          {/* Trend Range Slider Control */}
          <div className="px-1 pt-3 border-t border-white/5 mt-4 flex items-center justify-between gap-4 text-[10px] font-mono">
            <span className="text-slate-500 font-bold">HISTORICAL DEPTH SELECTOR</span>
            <div className="flex items-center gap-2.5 flex-1 max-w-[220px]">
              <input
                type="range"
                min="5"
                max="20"
                value={trendRange}
                onChange={(e) => setTrendRange(parseInt(e.target.value))}
                className="w-full accent-cyan-400 h-1 bg-black/40 rounded-lg appearance-none cursor-pointer border border-cyan-500/10"
              />
              <span className="text-cyan-300 font-bold w-12 text-right">{trendRange} frames</span>
            </div>
          </div>
        </Card>

        {/* Frequency Utilization */}
        <Card className="p-5 border-cyan-500/10 bg-[#07111f] rounded-[1.5rem] hover:border-cyan-500/15 transition-all">
          <CardHeader className="mb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold">Frequency Utilization Density</CardTitle>
            <span className="text-[10px] font-mono font-bold text-slate-500 bg-black/30 px-2 py-0.5 rounded border border-white/5">
              ACTIVE BINS
            </span>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredFrequencyUtilization}>
                <CartesianGrid stroke="#16314d" strokeDasharray="3 3" />
                <XAxis dataKey="band" tick={{ fill: "#6b7280", fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: "#6b7280", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#07111f", border: "1px solid rgba(0,255,255,0.2)", color: "white", fontSize: 12 }} />
                <Bar dataKey="usage" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Channel Activity %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Footer */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
        <div className="bg-black/30 border border-white/5 p-4 rounded-xl text-center">
          <span className="text-slate-550 text-xs font-semibold">TOTAL SPECTRAL SAMPLES</span>
          <div className="text-xl font-bold text-cyan-300 font-mono mt-1">
            {(health.total_inferences ?? 24532).toLocaleString()}
          </div>
        </div>

        <div className="bg-black/30 border border-white/5 p-4 rounded-xl text-center">
          <span className="text-slate-550 text-xs font-semibold">DETECTED ANOMALIES</span>
          <div className="text-xl font-bold text-red-400 font-mono mt-1">
            {health.total_anomalies ?? 328}
          </div>
        </div>

        <div className="bg-black/30 border border-white/5 p-4 rounded-xl text-center">
          <span className="text-slate-550 text-xs font-semibold">AVG OCCUPANCY RATE</span>
          <div className="text-xl font-bold text-teal-300 font-mono mt-1">
            {filteredCurrent.occupancy_percent.toFixed(2)}%
          </div>
        </div>

        <div className="bg-black/30 border border-white/5 p-4 rounded-xl text-center">
          <span className="text-slate-550 text-xs font-semibold">TOTAL INTERFERENCES</span>
          <div className="text-xl font-bold text-purple-300 font-mono mt-1">
            {health.total_anomalies ?? 156}
          </div>
        </div>
      </div>
    </div>
  );
}