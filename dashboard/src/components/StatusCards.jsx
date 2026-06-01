import {
  ShieldAlert,
  Activity,
  AlertTriangle,
  Clock,
  Gauge,
  ShieldCheck
} from "lucide-react";

export default function StatusCards({ state }) {
  const anomaly = state?.status === "ANOMALY";

  const confidence = state?.score
    ? Math.min((state.score / state.threshold) * 100, 99.9).toFixed(1) + "%"
    : "--";

  const severity =
    state?.score > state?.threshold * 100
      ? "CRITICAL"
      : state?.score > state?.threshold * 20
      ? "HIGH"
      : "LOW";

  const cards = [
    {
      title: "STATUS",
      value: state?.status || "--",
      icon: ShieldAlert
    },
    {
      title: "THREAT SCORE",
      value: state?.score ? state.score.toExponential(3) : "--",
      icon: Activity
    },
    {
      title: "THRESHOLD",
      value: state?.threshold ? state.threshold.toExponential(3) : "--",
      icon: AlertTriangle
    },
    {
      title: "CONFIDENCE",
      value: confidence,
      icon: Gauge
    },
    {
      title: "SEVERITY",
      value: severity,
      icon: ShieldCheck
    },
    {
      title: "LAST UPDATE",
      value: state?.timestamp || "--",
      icon: Clock
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-6">
      {cards.map((card, i) => {
        const Icon = card.icon;

        return (
          <div
            key={i}
            className={`rounded-3xl p-8 border backdrop-blur-xl shadow-2xl ${
              anomaly
                ? "bg-red-950/20 border-red-500/20"
                : "bg-slate-900/70 border-cyan-500/10"
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="text-slate-400 text-2xl uppercase tracking-widest">
                  {card.title}
                </div>

                <div className="mt-4 text-4xl md:text-5xl font-bold break-all">
                  {card.value}
                </div>
              </div>

              <Icon
                size={40}
                className={
                  anomaly ? "text-red-400" : "text-cyan-400"
                }
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}