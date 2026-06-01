export default function AlertBanner({ state }) {
  if (!state) return null;

  const anomaly = state.status === "ANOMALY";

  return (
    <div
      className={`rounded-3xl border p-6 md:p-8 shadow-2xl ${
        anomaly
          ? "bg-red-950/30 border-red-500/30"
          : "bg-emerald-950/20 border-emerald-500/20"
      }`}
    >
      <div className="flex flex-col xl:flex-row xl:justify-between gap-4">

        <div>
          <div className="text-3xl md:text-4xl font-black tracking-wide">
            {anomaly
              ? "RF THREAT DETECTED"
              : "SYSTEM NOMINAL"}
          </div>

          <div className="text-2xl md:text-3xl text-slate-300 mt-3 leading-relaxed">
            {anomaly
              ? "Suspicious wireless activity identified by anomaly engine"
              : "No abnormal wireless threat activity detected"}
          </div>
        </div>

        <div className="text-base md:text-lg font-semibold text-slate-300">
          {state.timestamp}
        </div>

      </div>
    </div>
  );
}