import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar
} from "recharts";

export default function AnalyticsPanel({
  analytics,
  telemetry
}) {
  if (!analytics) return null;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

      <div className="rounded-3xl bg-slate-950/70 border border-cyan-500/20 p-6 shadow-2xl">
        <h3 className="text-3xl font-black mb-5">
          Threat Trend
        </h3>

        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics.trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="t" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#22d3ee"
                strokeWidth={4}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-3xl bg-slate-950/70 border border-cyan-500/20 p-6 shadow-2xl">
        <h3 className="text-3xl font-black mb-5">
          Detection Distribution
        </h3>

        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.distribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#38bdf8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-3xl bg-slate-950/70 border border-cyan-500/20 p-6 shadow-2xl">
        <h3 className="text-3xl font-black mb-5">
          Device Telemetry
        </h3>

        <div className="space-y-5 text-xl">
          <Telemetry label="RTL-SDR" value={telemetry?.rtl_sdr} />
          <Telemetry label="Raspberry Pi" value={telemetry?.raspberry_pi} />
          <Telemetry label="AI Engine" value={telemetry?.ai_engine} />
          <Telemetry label="API Server" value={telemetry?.api_server} />
          <Telemetry label="Signal Source" value={telemetry?.signal_source} />
        </div>
      </div>

    </div>
  );
}

function Telemetry({ label, value }) {
  return (
    <div className="flex justify-between border-b border-slate-800 pb-3">
      <span className="text-slate-400">{label}</span>
      <span className="font-bold text-cyan-400">{value}</span>
    </div>
  );
}