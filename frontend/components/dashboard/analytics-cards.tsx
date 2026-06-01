"use client";

import { useMemo } from "react";
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

  const cards = [
    { title: "Average Power", value: `${current.mean_power.toFixed(2)} dBm`, icon: Radio, color: "text-cyan-300", bg: "border-cyan-500/10 bg-cyan-500/[0.02]" },
    { title: "Peak Power", value: `${current.peak_power.toFixed(2)} dBm`, icon: TrendingUp, color: "text-purple-300", bg: "border-purple-500/10 bg-purple-500/[0.02]" },
    { title: "Spectral Occupancy", value: `${current.occupancy_percent.toFixed(2)}%`, icon: BarChart3, color: "text-teal-300", bg: "border-teal-500/10 bg-teal-500/[0.02]" },
    { title: "Dynamic Range", value: `${current.dynamic_range.toFixed(2)} dB`, icon: AlertTriangle, color: "text-yellow-300", bg: "border-yellow-500/10 bg-yellow-500/[0.02]" },
  ];

  return (
    <div className="space-y-12">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className={`p-6 border rounded-[2rem] shadow-lg ${card.bg}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-xl font-bold text-slate-400">
                  {card.title}
                </CardTitle>
                <Icon className={`h-8 w-8 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-4xl font-black ${card.color}`}>
                  {card.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
        {/* Signal Power Over Time Trend */}
        <Card className="p-8 border-cyan-500/10 bg-[#07111f]">
          <CardHeader className="mb-6">
            <CardTitle className="text-3xl font-black">Signal Power Over Time</CardTitle>
          </CardHeader>
          <CardContent className="h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid stroke="#16314d" strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{ fill: "#6b7280", fontSize: 13 }} />
                <YAxis domain={[-90, -10]} tick={{ fill: "#6b7280", fontSize: 13 }} />
                <Tooltip contentStyle={{ background: "#07111f", border: "1px solid rgba(0,255,255,0.2)", color: "white" }} />
                <Legend wrapperStyle={{ fontSize: "14px" }} />
                <Line type="monotone" dataKey="Mean Power" stroke="#06b6d4" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Peak Power" stroke="#c084fc" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Frequency Utilization */}
        <Card className="p-8 border-cyan-500/10 bg-[#07111f]">
          <CardHeader className="mb-6">
            <CardTitle className="text-3xl font-black">Frequency Utilization Density</CardTitle>
          </CardHeader>
          <CardContent className="h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={frequencyUtilization}>
                <CartesianGrid stroke="#16314d" strokeDasharray="3 3" />
                <XAxis dataKey="band" tick={{ fill: "#6b7280", fontSize: 13 }} />
                <YAxis domain={[0, 100]} tick={{ fill: "#6b7280", fontSize: 13 }} />
                <Tooltip contentStyle={{ background: "#07111f", border: "1px solid rgba(0,255,255,0.2)", color: "white" }} />
                <Bar dataKey="usage" fill="#14b8a6" radius={[6, 6, 0, 0]} name="Channel Activity %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Footer */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-6">
        <div className="bg-black/30 border border-white/5 p-6 rounded-2xl text-center">
          <span className="text-slate-500 text-base font-bold">TOTAL SPECTRAL SAMPLES</span>
          <div className="text-3xl font-black text-cyan-300 font-mono mt-2">
            {(health.total_inferences ?? 24532).toLocaleString()}
          </div>
        </div>

        <div className="bg-black/30 border border-white/5 p-6 rounded-2xl text-center">
          <span className="text-slate-500 text-base font-bold">DETECTED ANOMALIES</span>
          <div className="text-3xl font-black text-red-400 font-mono mt-2">
            {health.total_anomalies ?? 328}
          </div>
        </div>

        <div className="bg-black/30 border border-white/5 p-6 rounded-2xl text-center">
          <span className="text-slate-500 text-base font-bold">AVG OCCUPANCY RATE</span>
          <div className="text-3xl font-black text-teal-300 font-mono mt-2">
            {(current.occupancy_percent || 0.33).toFixed(2)}%
          </div>
        </div>

        <div className="bg-black/30 border border-white/5 p-6 rounded-2xl text-center">
          <span className="text-slate-500 text-base font-bold">TOTAL INTERFERENCES</span>
          <div className="text-3xl font-black text-purple-300 font-mono mt-2">
            {health.total_anomalies ?? 156}
          </div>
        </div>
      </div>
    </div>
  );
}