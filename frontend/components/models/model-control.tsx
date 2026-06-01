import { Button } from "@/components/ui/button";
import { useModelHistory, useSwitchModel } from "@/hooks/use-model";
import { Cpu, RefreshCw, CheckCircle2, History, AlertTriangle, Layers, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ModelControl() {
  const history = useModelHistory();
  const switchModel = useSwitchModel();

  const rows = Array.isArray(history.data) ? history.data : [];

  let current = "autoencoder";
  if (rows.length > 0) {
    const latest = rows[0];
    current = latest.to_model || latest.model || "autoencoder";
  }

  const isAE = current.toLowerCase().includes("autoencoder");
  const isRF = current.toLowerCase().includes("random_forest") || current.toLowerCase().includes("rf");
  const isKNN = current.toLowerCase().includes("knn");

  return (
    <div className="space-y-12">
      {/* Active Model Controls Card */}
      <Card className="p-8 border-cyan-500/10 bg-[#07111f] shadow-[0_0_50px_rgba(0,255,255,0.02)] rounded-[2rem]">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center gap-4">
            <Cpu className="h-9 w-9 text-cyan-300 animate-pulse" />
            <CardTitle className="text-4xl font-black text-white">Model Operations Governance</CardTitle>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-green-500/20 bg-green-500/10 text-green-300 font-bold text-sm tracking-widest font-mono">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-ping" />
            ACTIVE MODEL
          </div>
        </CardHeader>

        <CardContent className="space-y-8 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Autoencoder Card */}
            <div
              className={`p-8 border rounded-2xl transition-all duration-300 relative overflow-hidden ${
                isAE
                  ? "border-cyan-500/40 bg-cyan-500/[0.04] shadow-[0_0_30px_rgba(6,182,212,0.1)]"
                  : "border-white/5 bg-black/20 opacity-70 hover:opacity-90"
              }`}
            >
              {isAE && (
                <div className="absolute top-0 right-0 bg-cyan-500 text-black px-4 py-1.5 rounded-bl-xl text-xs font-black tracking-widest font-mono">
                  ACTIVE
                </div>
              )}
              <h3 className="text-2xl font-black text-white flex items-center gap-3">
                <Layers className={`h-6 w-6 ${isAE ? "text-cyan-300" : "text-slate-400"}`} />
                Unsupervised Autoencoder
              </h3>
              <p className="text-slate-400 text-base mt-3 font-semibold leading-relaxed">
                Learns the standard baseline features. Flags anomalies using reconstruction error threshold calculations.
              </p>
              <Button
                className={`mt-6 w-full py-6 text-lg font-black transition-all ${
                  isAE
                    ? "bg-cyan-500 text-black shadow-lg"
                    : "bg-transparent border border-white/10 hover:border-cyan-500/40 text-slate-300 hover:text-white"
                }`}
                disabled={switchModel.isPending || isAE}
                onClick={() => switchModel.mutate("autoencoder")}
              >
                {switchModel.isPending && isAE ? (
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                ) : null}
                {isAE ? "Active Baseline Engine" : "Switch to Autoencoder"}
              </Button>
            </div>

            {/* Random Forest Card */}
            <div
              className={`p-8 border rounded-2xl transition-all duration-300 relative overflow-hidden ${
                isRF
                  ? "border-purple-500/40 bg-purple-500/[0.04] shadow-[0_0_30px_rgba(192,132,252,0.1)]"
                  : "border-white/5 bg-black/20 opacity-70 hover:opacity-90"
              }`}
            >
              {isRF && (
                <div className="absolute top-0 right-0 bg-purple-500 text-white px-4 py-1.5 rounded-bl-xl text-xs font-black tracking-widest font-mono">
                  ACTIVE
                </div>
              )}
              <h3 className="text-2xl font-black text-white flex items-center gap-3">
                <Cpu className={`h-6 w-6 ${isRF ? "text-purple-300" : "text-slate-400"}`} />
                Supervised Random Forest
              </h3>
              <p className="text-slate-400 text-base mt-3 font-semibold leading-relaxed">
                Supervised threat classifier model trained on specific threat profiles. Excellent at tag classifications & confidence scores.
              </p>
              <Button
                className={`mt-6 w-full py-6 text-lg font-black transition-all ${
                  isRF
                    ? "bg-purple-500 text-white shadow-lg"
                    : "bg-transparent border border-white/10 hover:border-purple-500/40 text-slate-300 hover:text-white"
                }`}
                disabled={switchModel.isPending || isRF}
                onClick={() => switchModel.mutate("random_forest")}
              >
                {switchModel.isPending && isRF ? (
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                ) : null}
                {isRF ? "Active Classifier Engine" : "Switch to Random Forest"}
              </Button>
            </div>

            {/* KNN Card */}
            <div
              className={`p-8 border rounded-2xl transition-all duration-300 relative overflow-hidden ${
                isKNN
                  ? "border-teal-500/40 bg-teal-500/[0.04] shadow-[0_0_30px_rgba(20,184,166,0.1)]"
                  : "border-white/5 bg-black/20 opacity-70 hover:opacity-90"
              }`}
            >
              {isKNN && (
                <div className="absolute top-0 right-0 bg-teal-500 text-black px-4 py-1.5 rounded-bl-xl text-xs font-black tracking-widest font-mono">
                  ACTIVE
                </div>
              )}
              <h3 className="text-2xl font-black text-white flex items-center gap-3">
                <Activity className={`h-6 w-6 ${isKNN ? "text-teal-300" : "text-slate-400"}`} />
                Distance-Based KNN
              </h3>
              <p className="text-slate-400 text-base mt-3 font-semibold leading-relaxed">
                Evaluates distance metrics in N-dimensional space to identify unexpected clusters or outliers quickly.
              </p>
              <Button
                className={`mt-6 w-full py-6 text-lg font-black transition-all ${
                  isKNN
                    ? "bg-teal-500 text-black shadow-lg"
                    : "bg-transparent border border-white/10 hover:border-teal-500/40 text-slate-300 hover:text-white"
                }`}
                disabled={switchModel.isPending || isKNN}
                onClick={() => switchModel.mutate("knn")}
              >
                {switchModel.isPending && isKNN ? (
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                ) : null}
                {isKNN ? "Active KNN Engine" : "Switch to KNN"}
              </Button>
            </div>
          </div>

          {/* Feedback messages */}
          {switchModel.isPending && (
            <div className="flex items-center gap-3 text-yellow-400 text-lg font-black font-mono animate-pulse">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>PROPAGATING MODEL CHANGE ACROSS EDGE NODES...</span>
            </div>
          )}
          {switchModel.isSuccess && (
            <div className="flex items-center gap-3 text-emerald-400 text-lg font-black font-mono">
              <CheckCircle2 className="h-6 w-6" />
              <span>MODEL INSTANCE SWITCHED SUCCESSFULLY (STATUS: SYNCHRONIZED)</span>
            </div>
          )}
          {switchModel.isError && (
            <div className="flex items-center gap-3 text-red-400 text-lg font-black font-mono">
              <AlertTriangle className="h-6 w-6" />
              <span>FAILED TO TRANSMIT SWITCH SIGNAL. RETRY.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Model Switch History Card */}
      <Card className="p-8 border-cyan-500/10 bg-[#07111f] shadow-[0_0_50px_rgba(0,255,255,0.02)] rounded-[2rem]">
        <CardHeader className="flex flex-row items-center gap-4 mb-6">
          <History className="h-8 w-8 text-cyan-300" />
          <CardTitle className="text-3xl font-black text-white">Model Transition Log</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-bold text-lg">
              No model modifications recorded. Base configuration active.
            </div>
          ) : (
            <div className="relative border-l border-cyan-500/15 ml-4 pl-8 space-y-8">
              {rows.map((row: any, index: number) => {
                const date = new Date(row.timestamp);
                const timeStr = isNaN(date.getTime())
                  ? row.timestamp
                  : `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;

                return (
                  <div key={row.id || index} className="relative group transition-all duration-300">
                    {/* Glowing Connector Node */}
                    <div className="absolute -left-[38px] top-1.5 h-4.5 w-4.5 rounded-full border border-cyan-400 bg-slate-950 flex items-center justify-center shadow-[0_0_10px_rgba(0,255,255,0.8)] z-10 transition-transform duration-300 group-hover:scale-125" />
                    
                    <div className="bg-black/25 border border-white/5 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-300 hover:border-cyan-500/20 hover:bg-white/[0.01]">
                      <div className="space-y-1">
                        <div className="text-lg font-black text-white flex items-center gap-3">
                          <span className="text-slate-500 font-medium">Changed from</span>
                          <span className="text-cyan-300 font-mono tracking-wide">{row.from_model?.replace("_", " ").toUpperCase() || "AUTOENCODER"}</span>
                          <span className="text-slate-500 font-medium">to</span>
                          <span className="text-purple-300 font-mono tracking-wide">{(row.to_model || row.model)?.replace("_", " ").toUpperCase() || "UNKNOWN"}</span>
                        </div>
                      </div>
                      <div suppressHydrationWarning className="text-slate-500 font-bold font-mono text-sm tracking-wide self-end md:self-auto">
                        {timeStr}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}