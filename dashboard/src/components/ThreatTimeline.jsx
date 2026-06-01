function parseEvent(evt) {
  try {
    const timeMatch = evt.match(/\[(.*?)\]/);
    const statusMatch = evt.match(/\]\s+(ANOMALY|NORMAL)/);
    const scoreMatch = evt.match(/Score=([0-9.eE-]+)/);

    return {
      time: timeMatch ? timeMatch[1].split(" ")[1].split(".")[0] : "--:--:--",
      status: statusMatch ? statusMatch[1] : "UNKNOWN",
      score: scoreMatch ? Number(scoreMatch[1]).toExponential(3) : "--"
    };
  } catch {
    return {
      time: "--:--:--",
      status: "UNKNOWN",
      score: "--"
    };
  }
}

export default function ThreatTimeline({ events }) {
  return (
    <div className="rounded-3xl bg-slate-950/70 border border-cyan-500/20 shadow-2xl p-8 h-full">

      <div className="mb-8">
        <h3 className="text-4xl font-black">
          Threat Event Console
        </h3>

        <p className="text-2xl text-slate-300 mt-3">
          Real-time anomaly event stream
        </p>
      </div>

      <div className="space-y-4 max-h-[900px] overflow-y-auto pr-2">
        {events.length ? (
          events.map((evt, idx) => {
            const parsed = parseEvent(evt);
            const anomaly = parsed.status === "ANOMALY";

            return (
              <div
                key={idx}
                className={`rounded-2xl border p-5 ${
                  anomaly
                    ? "bg-red-950/20 border-red-500/20"
                    : "bg-slate-900/70 border-slate-800"
                }`}
              >
                <div className="flex justify-between items-center">

                  <div>
                    <div className="text-2xl font-bold">
                      {parsed.time}
                    </div>

                    <div
                      className={`text-xl font-black mt-2 ${
                        anomaly
                          ? "text-red-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {parsed.status}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base text-slate-400">
                      SCORE
                    </div>

                    <div className="text-xl font-bold text-cyan-300 mt-2">
                      {parsed.score}
                    </div>
                  </div>

                </div>
              </div>
            );
          })
        ) : (
          <div className="text-2xl text-slate-400">
            No events yet
          </div>
        )}
      </div>

    </div>
  );
}