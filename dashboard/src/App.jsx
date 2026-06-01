import React, { useEffect, useState } from "react";
import {
  Shield,
  AlertTriangle,
  Activity,
  Radar,
  Zap,
  Wifi,
  Clock3,
  Server,
} from "lucide-react";

const API = "http://127.0.0.1:8000";

function MetricCard({ title, value, icon, danger = false }) {
  return (
    <div
      className={`
        rounded-2xl border p-4 md:p-5 shadow-xl
        bg-slate-900/80 backdrop-blur-xl
        min-h-[120px]
        transition-all duration-300 hover:scale-[1.02]
        ${danger ? "border-red-500/30" : "border-cyan-500/20"}
      `}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">
            {title}
          </div>

          <div className="mt-4 text-lg md:text-2xl xl:text-3xl font-bold text-white break-words">
            {value}
          </div>
        </div>

        <div
          className={danger ? "text-red-400 shrink-0" : "text-cyan-400 shrink-0"}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [state, setState] = useState(null);
  const [intel, setIntel] = useState(null);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const clock = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(clock);
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        setError(null);

        const [stateRes, intelRes] = await Promise.all([
          fetch(`${API}/api/state`),
          fetch(`${API}/api/intelligence`),
        ]);

        const stateJson = await stateRes.json();
        const intelJson = await intelRes.json();

        setState(stateJson);
        setIntel(intelJson);
      } catch (err) {
        console.error(err);
        setError("Backend API unavailable.");
      }
    }

    fetchData();

    const interval = setInterval(fetchData, 2000);

    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-red-400">
            Dashboard Connection Error
          </div>
          <div className="mt-3 text-slate-300 text-lg">{error}</div>
        </div>
      </div>
    );
  }

  if (!state || !intel) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-2xl md:text-3xl font-bold text-cyan-300">
          Initializing RF SOC...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 md:px-6 xl:px-8 py-5">
      {/* HERO HEADER */}
      <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-slate-950 via-blue-950 to-slate-950 p-5 md:p-7 shadow-2xl mb-5">
        <div className="flex flex-col xl:flex-row justify-between gap-5">
          <div>
            <div className="flex items-center gap-3">
              <Shield className="text-cyan-400" size={34} />

              <div>
                <h1 className="text-2xl md:text-4xl xl:text-5xl font-black">
                  RF Threat Intelligence
                </h1>

                <p className="text-cyan-400 text-lg md:text-2xl font-bold">
                  SOC Command Center
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm md:text-base text-slate-300">
              AI-powered real-time RF anomaly monitoring and threat intelligence
              platform
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="px-4 py-3 rounded-xl bg-slate-900/80 border border-cyan-500/20 text-cyan-300 text-sm font-bold text-center">
              SECURE
            </div>

            <div className="px-4 py-3 rounded-xl bg-slate-900/80 border border-cyan-500/20 text-cyan-300 text-sm font-bold text-center">
              LIVE
            </div>

            <div className="px-4 py-3 rounded-xl bg-slate-900/80 border border-cyan-500/20 text-cyan-300 text-sm font-bold text-center">
              ONLINE
            </div>

            <div className="px-4 py-3 rounded-xl bg-slate-900/80 border border-cyan-500/20 text-cyan-300 text-sm font-bold text-center">
              {now.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* ALERT */}
      <div className="rounded-xl border border-red-500/30 bg-red-950/20 px-5 py-4 mb-5">
        <div className="flex items-center gap-3">
          <AlertTriangle className="text-red-400" />

          <div>
            <div className="text-lg md:text-xl font-bold text-red-300">
              CRITICAL RF THREAT DETECTED
            </div>

            <div className="text-sm md:text-base text-slate-300 mt-1">
              {intel.summary}
            </div>
          </div>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <MetricCard
          title="Status"
          value={state.status}
          icon={<Radar />}
          danger={state.status === "ANOMALY"}
        />

        <MetricCard
          title="Threat Score"
          value={Number(state.score).toExponential(2)}
          icon={<Activity />}
          danger
        />

        <MetricCard
          title="Threshold"
          value={Number(state.threshold).toExponential(2)}
          icon={<AlertTriangle />}
        />

        <MetricCard
          title="Confidence"
          value={`${intel.confidence}%`}
          icon={<Zap />}
        />

        <MetricCard
          title="Severity"
          value={intel.severity}
          icon={<Shield />}
          danger
        />

        <MetricCard
          title="Threat Type"
          value={intel.threat_type}
          icon={<Wifi />}
        />

        <MetricCard
          title="Hotspot"
          value="433.92 MHz"
          icon={<Radar />}
        />

        <MetricCard
          title="Latency"
          value="48 ms"
          icon={<Clock3 />}
        />

        <MetricCard
          title="API Server"
          value="ONLINE"
          icon={<Server />}
        />

        <MetricCard
          title="Mode"
          value="REAL-TIME"
          icon={<Activity />}
        />
      </div>
    </div>
  );
}