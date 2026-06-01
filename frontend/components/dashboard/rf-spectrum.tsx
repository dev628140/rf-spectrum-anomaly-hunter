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
    <div className="rounded-[2rem] border border-cyan-500/10 bg-[#07111f] p-10 shadow-[0_0_60px_rgba(0,255,255,0.04)] h-full flex flex-col justify-between">
      {/* HEADER */}
      <div className="flex items-start justify-between mb-8 shrink-0">
        <div className="flex items-center gap-4">
          <Activity className="h-9 w-9 text-cyan-300 animate-pulse" />
          <div>
            <h2 className="text-4xl font-black leading-none text-white tracking-tight">
              Live RF Spectrum
            </h2>
            <p className="text-base font-semibold text-slate-300 mt-2">
              Realtime RF spectrum intelligence (88.0 - 108.0 MHz)
            </p>
          </div>
        </div>

        <div className="flex gap-6">
          {/* STATUS */}
          <div className="rounded-2xl border border-cyan-500/25 bg-cyan-500/10 px-6 py-3 min-w-[180px] text-center shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <div className="text-xs font-black tracking-widest text-slate-300 uppercase">
              SIGNAL STATE
            </div>
            <div className={`mt-2 text-3xl font-black uppercase tracking-wider ${statusColor}`}>
              {status}
            </div>
          </div>

          {/* PEAKS */}
          <div className="rounded-2xl border border-fuchsia-500/25 bg-fuchsia-500/10 px-6 py-3 min-w-[150px] text-center shadow-[0_0_15px_rgba(217,70,239,0.15)]">
            <div className="text-xs font-black tracking-widest text-slate-300 uppercase">
              RF PEAKS
            </div>
            <div className="mt-2 text-3xl font-black text-fuchsia-300 font-mono">
              {peakCount}
            </div>
          </div>
        </div>
      </div>

      {/* CHART CONTAINER (h-[420px]) */}
      <div className="h-[420px] w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={spectrum}
            margin={{
              top: 20,
              right: 20,
              left: -15,
              bottom: 10,
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
                fontSize: 15,
                fontWeight: "bold",
              }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              tick={{
                fill: "#94a3b8",
                fontSize: 15,
                fontWeight: "bold",
              }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              contentStyle={{
                background: "#07111f",
                border: "1px solid rgba(0,255,255,0.2)",
                borderRadius: "16px",
                color: "white",
                fontFamily: "monospace",
                fontWeight: "bold",
                fontSize: "14px",
              }}
            />

            <ReferenceLine
              y={threshold}
              stroke="#ff4d4f"
              strokeDasharray="8 5"
              strokeWidth={2}
            />

            <Area
              type="monotone"
              dataKey="power"
              stroke="#22d3ee"
              strokeWidth={3.5}
              fill="url(#rfFill)"
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* FOOTER */}
      <div className="mt-8 grid grid-cols-3 gap-6 shrink-0">
        {/* PEAK */}
        <div className="rounded-2xl border border-cyan-500/10 bg-cyan-500/[0.03] p-6 shadow-[0_0_15px_rgba(6,182,212,0.02)]">
          <div className="text-sm font-black text-slate-400 uppercase tracking-wider">
            Peak Power
          </div>
          <div className="mt-2 text-3xl font-black text-cyan-300 font-mono">
            {peak.toFixed(2)} <span className="text-base text-slate-400 font-semibold font-sans">dBm</span>
          </div>
        </div>

        {/* OCCUPANCY */}
        <div className="rounded-2xl border border-cyan-500/10 bg-cyan-500/[0.03] p-6 shadow-[0_0_15px_rgba(6,182,212,0.02)]">
          <div className="text-sm font-black text-slate-400 uppercase tracking-wider">
            Occupancy
          </div>
          <div className="mt-2 text-3xl font-black text-cyan-300 font-mono">
            {(occupancy * 100).toFixed(1)}%
          </div>
        </div>

        {/* RANGE */}
        <div className="rounded-2xl border border-cyan-500/10 bg-cyan-500/[0.03] p-6 shadow-[0_0_15px_rgba(6,182,212,0.02)]">
          <div className="text-sm font-black text-slate-400 uppercase tracking-wider">
            Dynamic Range
          </div>
          <div className="mt-2 text-3xl font-black text-cyan-300 font-mono">
            {dynamicRange.toFixed(2)} <span className="text-base text-slate-400 font-semibold font-sans">dB</span>
          </div>
        </div>
      </div>
    </div>
  );
}