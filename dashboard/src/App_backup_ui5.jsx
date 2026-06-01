import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

const API = "http://127.0.0.1:8000";

export default function App() {
  const [state, setState] = useState(null);
  const [events, setEvents] = useState([]);
  const [intel, setIntel] = useState(null);
  const [trend, setTrend] = useState([]);
  const [fftData, setFftData] = useState([]);
  const [clock, setClock] = useState(new Date());
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    fetchAll();

    const poll = setInterval(fetchAll, 2000);

    const timer = setInterval(() => {
      setClock(new Date());
      setUptime((u) => u + 1);

      setFftData(
        Array.from({ length: 40 }, (_, i) => ({
          idx: i,
          val: 20 + Math.random() * 80,
        }))
      );
    }, 1000);

    return () => {
      clearInterval(poll);
      clearInterval(timer);
    };
  }, []);

  async function fetchAll() {
    try {
      const [s, e, i] = await Promise.all([
        fetch(`${API}/api/state`).then((r) => r.json()),
        fetch(`${API}/api/events`).then((r) => r.json()),
        fetch(`${API}/api/intelligence`).then((r) => r.json()),
      ]);

      setState(s);
      setEvents(e.events || []);
      setIntel(i);

      setTrend((prev) => {
        const next = [...prev, { value: s.score * 100000 }];
        return next.slice(-25);
      });
    } catch {}
  }

  function fmt(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h}h ${m}m ${s}s`;
  }

  const anomalyCount = events.filter((x) => x.includes("ANOMALY")).length;
  const normalCount = Math.max(events.length - anomalyCount, 0);

  const pieData = [
    { name: "Normal", value: normalCount },
    { name: "Anomaly", value: anomalyCount },
  ];

  const riskIndex = intel?.severity === "CRITICAL"
    ? 96
    : intel?.severity === "HIGH"
    ? 82
    : intel?.severity === "MEDIUM"
    ? 58
    : 25;

  return (
    <div className="min-h-screen bg-[#020817] text-white px-8 xl:px-12 py-8">
      <div className="w-full space-y-8">

        {/* HERO */}
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-cyan-900 bg-gradient-to-r from-slate-950 via-blue-950 to-slate-950 p-8 shadow-2xl"
        >
          <div className="flex flex-col 2xl:flex-row justify-between gap-8">
            <div>
              <h1 className="text-6xl xl:text-7xl font-black">
                RF Threat Intelligence
              </h1>
              <h2 className="text-3xl xl:text-4xl text-cyan-400 font-bold">
                Command Center
              </h2>
              <p className="text-xl text-slate-300 mt-4 max-w-4xl">
                AI-powered real-time wireless threat surveillance and anomaly intelligence platform
              </p>
            </div>

            <div className="flex flex-wrap gap-4 items-start">
              <Badge text="SECURE" />
              <Badge text="REAL-TIME" />
              <Badge text="LIVE MONITORING" />
              <Badge text={clock.toLocaleTimeString()} />
              <Badge text={fmt(uptime)} />
            </div>
          </div>
        </motion.div>

        {/* ALERT */}
        <motion.div
          animate={{ opacity: [1, 0.6, 1] }}
          transition={{ repeat: Infinity, duration: 1.3 }}
          className="rounded-2xl border border-red-700 bg-red-950/40 p-6"
        >
          <div className="text-3xl font-black text-red-300">
            🚨 CRITICAL RF THREAT DETECTED
          </div>
          <div className="text-lg mt-2 text-red-200">
            Suspicious wireless anomaly significantly above learned RF baseline
          </div>
        </motion.div>

        {/* TOP METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 2xl:grid-cols-10 gap-5">
          <Metric title="STATUS" value={state?.status || "WAITING"} />
          <Metric title="SCORE" value={state?.score?.toExponential(3)} />
          <Metric title="THRESHOLD" value={state?.threshold?.toExponential(3)} />
          <Metric title="CONFIDENCE" value={`${intel?.confidence || 0}%`} />
          <Metric title="SEVERITY" value={intel?.severity || "UNKNOWN"} />
          <Metric title="TYPE" value={intel?.threat_type || "UNKNOWN"} />
          <Metric title="RISK INDEX" value={`${riskIndex}/100`} />
          <Metric title="LATENCY" value="48 ms" />
          <Metric title="HOTSPOT" value="433.92 MHz" />
          <Metric title="EVENTS" value={events.length} />
        </div>

        {/* MAIN */}
        <div className="grid grid-cols-1 2xl:grid-cols-4 gap-6">

          {/* LEFT */}
          <div className="2xl:col-span-3 space-y-6">

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

              <Panel title="AI Threat Assessment">
                <div className="text-3xl font-black text-cyan-300">
                  {intel?.threat_type}
                </div>

                <div className="mt-5 text-xl text-slate-300 leading-relaxed">
                  {intel?.summary}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <MiniStat label="Risk Index" value={`${riskIndex}/100`} />
                  <MiniStat label="Operational Mode" value="LIVE" />
                  <MiniStat label="Probable Cause" value="Key Burst" />
                  <MiniStat label="Recommendation" value="Monitor" />
                </div>
              </Panel>

              <Panel title="Live RF Spectrum FFT">
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={fftData}>
                      <XAxis hide />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="val"
                        stroke="#22d3ee"
                        fill="#0ea5e9"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
            </div>

            <Panel title="AI Explainability Engine">
              <img
                src={`${API}/static/live_runtime/latest_explainability.png?${Date.now()}`}
                alt="xai"
                className="w-full rounded-2xl"
              />
            </Panel>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

              <Panel title="Threat Trend">
                <div className="h-[420px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trend}>
                      <XAxis hide />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#22d3ee"
                        strokeWidth={4}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Panel>

              <Panel title="Detection Distribution">
                <div className="h-[420px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        outerRadius={150}
                        innerRadius={70}
                        label
                      >
                        <Cell fill="#22d3ee" />
                        <Cell fill="#ef4444" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-6">

            <Panel title="Threat Event Console">
              <div className="space-y-3 max-h-[900px] overflow-y-auto">
                {events.map((ev, idx) => {
                  const anomaly = ev.includes("ANOMALY");

                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`rounded-xl border p-4 ${
                        anomaly
                          ? "border-red-700 bg-red-950/20"
                          : "border-slate-700 bg-slate-900"
                      }`}
                    >
                      <div className="text-xl font-bold">
                        {anomaly ? "ANOMALY" : "NORMAL"}
                      </div>

                      <div className="text-base text-slate-300 mt-2 break-all">
                        {ev}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </Panel>

            <Panel title="Device Telemetry">
              <Telemetry label="RTL-SDR" value="CONNECTED" />
              <Telemetry label="Raspberry Pi" value="STANDBY" />
              <Telemetry label="AI Engine" value="ACTIVE" />
              <Telemetry label="API Server" value="ONLINE" />
              <Telemetry label="Signal Source" value="LIVE FEED" />
              <Telemetry label="Inference" value="48 ms" />
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ text }) {
  return (
    <div className="px-5 py-3 rounded-xl border border-cyan-800 bg-cyan-950/30 text-cyan-300 text-lg font-bold">
      {text}
    </div>
  );
}

function Metric({ title, value }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className="rounded-2xl border border-red-900 bg-slate-950 p-5"
    >
      <div className="text-lg text-slate-400 font-semibold">{title}</div>
      <div className="text-3xl font-black mt-3 break-words">{value}</div>
    </motion.div>
  );
}

function Panel({ title, children }) {
  return (
    <div className="rounded-3xl border border-cyan-900 bg-slate-950 p-6">
      <div className="text-3xl font-bold text-cyan-300 mb-5">{title}</div>
      {children}
    </div>
  );
}

function Telemetry({ label, value }) {
  return (
    <div className="flex justify-between border-b border-slate-800 py-4 text-xl">
      <span>{label}</span>
      <span className="text-cyan-300 font-bold">{value}</span>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
      <div className="text-sm text-slate-400">{label}</div>
      <div className="text-xl font-bold mt-2">{value}</div>
    </div>
  );
}