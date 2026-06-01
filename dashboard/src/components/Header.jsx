import { Shield } from "lucide-react";

const pills = [
  "SECURE",
  "REAL-TIME",
  "LIVE MONITORING"
];

export default function Header() {
  return (
    <div className="rounded-3xl border border-cyan-500/20 bg-slate-950/70 backdrop-blur-xl shadow-2xl p-10 md:p-12">

      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-10">

        <div>
          <div className="flex items-center gap-5">
            <Shield className="text-cyan-400" size={56} />

            <div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none">
                RF Threat Intelligence
              </h1>

              <h2 className="text-3xl md:text-5xl font-bold text-cyan-400 mt-3">
                Command Center
              </h2>
            </div>
          </div>

          <p className="mt-6 text-2xl md:text-4xl font-medium text-slate-300 max-w-6xl leading-relaxed">
            AI-powered real-time wireless threat surveillance and anomaly intelligence platform
          </p>
        </div>

        <div className="flex flex-wrap gap-5">
          {pills.map((pill) => (
            <div
              key={pill}
              className="px-8 py-4 rounded-2xl border border-cyan-500/20 bg-slate-900/70 text-xl md:text-2xl font-bold text-cyan-300"
            >
              {pill}
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}