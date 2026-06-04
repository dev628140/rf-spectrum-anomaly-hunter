"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";

import { Activity } from "lucide-react";
import { useRFStore } from "@/store/rf-store";

export function RFSpectrum() {
  const { rf } = useRFStore();

  const spectrum = rf?.signal?.spectrum || [];
  const metrics = rf?.signal?.metrics;
  const status = rf?.status?.state || "UNKNOWN";

  if (spectrum.length === 0) {
    return (
      <div className="rounded-[2rem] border border-cyan-500/10 bg-[#07111f] p-8 h-full flex items-center justify-center shadow-[0_0_60px_rgba(0,255,255,0.04)]">
        <div className="text-center">
          <Activity className="h-16 w-16 mx-auto text-cyan-400 animate-pulse" />
          <div className="mt-6 text-3xl font-black text-white tracking-widest font-mono">
            ESTABLISHING TELEMETRY LINK...
          </div>
          <div className="mt-3 text-lg text-slate-400 font-semibold">
            Realtime RF spectrum intelligence not yet available
          </div>
        </div>
      </div>
    );
  }

  const peak = metrics?.peak_power || 0;
  const occupancy = metrics?.occupancy || 0;
  const dynamicRange = metrics?.dynamic_range || 0;
  const threshold = -40;

  // Real-time local peak detection (local maxima)
  let peakCount = 0;
  for (let i = 1; i < spectrum.length - 1; i++) {
    const prev = spectrum[i - 1].power;
    const curr = spectrum[i].power;
    const next = spectrum[i + 1].power;
    if (curr > prev && curr > next && curr > -45) {
      peakCount++;
    }
  }
  
  if (peakCount === 0 && spectrum.length > 0) {
    const highPoints = spectrum.filter((x) => x.power > threshold).length;
    if (highPoints > 0) {
      peakCount = Math.round(highPoints / 8) || 1;
    }
  }

  const statusColor = status === "ANOMALY" ? "text-red-400" : "text-cyan-300";

  return (
    <div className="rounded-[1.5rem] border border-cyan-500/10 bg-[#07111f] p-4.5 shadow-[0_0_50px_rgba(0,255,255,0.03)] h-full flex flex-col justify-between">
      {/* HEADER */}
      <div className="flex items-start justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-cyan-300 animate-pulse" />
          <div>
            <h2 className="text-base font-black leading-none text-white tracking-tight">
              Live RF Spectrum
            </h2>
            <p className="text-[10px] font-semibold text-slate-300 mt-1">
              Realtime RF spectrum intelligence (88.0 - 108.0 MHz)
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {/* STATUS */}
          <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-1 min-w-[90px] text-center shadow-[0_0_10px_rgba(6,182,212,0.15)]">
            <div className="text-[9px] font-black tracking-widest text-slate-300 uppercase">
              STATE
            </div>
            <div className={`mt-0.5 text-sm font-black uppercase tracking-wider ${statusColor}`}>
              {status}
            </div>
          </div>

          {/* PEAKS */}
          <div className="rounded-xl border border-fuchsia-500/25 bg-fuchsia-500/10 px-2.5 py-1 min-w-[80px] text-center shadow-[0_0_10px_rgba(217,70,239,0.15)]">
            <div className="text-[9px] font-black tracking-widest text-slate-300 uppercase">
              PEAKS
            </div>
            <div className="mt-0.5 text-sm font-black text-fuchsia-300 font-mono">
              {peakCount}
            </div>
          </div>
        </div>
      </div>

      {/* CHART CONTAINER (h-[210px]) */}
      <div className="h-[210px] w-full flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={spectrum}
            margin={{
              top: 5,
              right: 5,
              left: -30,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient id="rfFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00e5ff" stopOpacity={0.6} />
                <stop offset="70%" stopColor="#00e5ff" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#00e5ff" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="#16314d" strokeDasharray="4 4" />

            <XAxis
              dataKey="frequency"
              tick={{
                fill: "#94a3b8",
                fontSize: 10,
                fontWeight: "bold",
              }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              tick={{
                fill: "#94a3b8",
                fontSize: 10,
                fontWeight: "bold",
              }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              contentStyle={{
                background: "#07111f",
                border: "1px solid rgba(0,255,255,0.2)",
                borderRadius: "10px",
                color: "white",
                fontFamily: "monospace",
                fontWeight: "bold",
                fontSize: "11px",
              }}
            />

            <ReferenceLine
              y={threshold}
              stroke="#ff4d4f"
              strokeDasharray="8 5"
              strokeWidth={1.2}
            />

            <Area
              type="monotone"
              dataKey="power"
              stroke="#22d3ee"
              strokeWidth={2.0}
              fill="url(#rfFill)"
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* FOOTER */}
      <div className="mt-3 grid grid-cols-3 gap-3 shrink-0">
        {/* PEAK */}
        <div className="rounded-xl border border-cyan-500/10 bg-cyan-500/[0.03] p-3 shadow-[0_0_10px_rgba(6,182,212,0.02)]">
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex justify-between">
            <span>Peak Power</span>
            {metrics?.mqtt_max_dbm !== undefined && metrics?.mqtt_max_dbm !== null && (
              <span className="text-cyan-400 font-bold">TX: {metrics.mqtt_max_dbm.toFixed(2)} dBm</span>
            )}
          </div>
          <div className="mt-0.5 text-sm font-black text-cyan-300 font-mono">
            {peak.toFixed(2)} <span className="text-[10px] text-slate-400 font-semibold font-sans">dBm</span>
          </div>
        </div>

        {/* OCCUPANCY */}
        <div className="rounded-xl border border-cyan-500/10 bg-cyan-500/[0.03] p-3 shadow-[0_0_10px_rgba(6,182,212,0.02)]">
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
            Occupancy
          </div>
          <div className="mt-0.5 text-sm font-black text-cyan-300 font-mono">
            {(occupancy * 100).toFixed(1)}%
          </div>
        </div>

        {/* RANGE */}
        <div className="rounded-xl border border-cyan-500/10 bg-cyan-500/[0.03] p-3 shadow-[0_0_10px_rgba(6,182,212,0.02)]">
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
            Dynamic Range
          </div>
          <div className="mt-0.5 text-sm font-black text-cyan-300 font-mono">
            {dynamicRange.toFixed(2)} <span className="text-[10px] text-slate-400 font-semibold font-sans">dB</span>
          </div>
        </div>
      </div>
    </div>
  );
}