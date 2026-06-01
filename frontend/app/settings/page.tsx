"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Cpu, HardDrive, Shield, Server, Activity } from "lucide-react";

export default function SettingsPage() {
  const [startFreq, setStartFreq] = useState("88.0");
  const [endFreq, setEndFreq] = useState("108.0");
  const [scanInterval, setScanInterval] = useState("2");
  const [fftSize, setFftSize] = useState("1024");
  const [sampleRate, setSampleRate] = useState("2.4");
  const [gain, setGain] = useState("20");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="flex min-h-screen bg-[#050816] text-white">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Topbar />

        <div className="p-12 space-y-12 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
            
            {/* RF Parameters Card */}
            <Card className="p-8 border-cyan-500/10 bg-[#07111f] shadow-[0_0_50px_rgba(0,255,255,0.02)]">
              <CardHeader className="flex flex-row items-center gap-4 mb-6">
                <Settings className="h-9 w-9 text-cyan-300" />
                <CardTitle className="text-4xl font-black">RF Parameter Settings</CardTitle>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSave} className="space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <label className="block text-xl font-bold text-slate-300 mb-3">Start Frequency (MHz)</label>
                      <input
                        type="text"
                        value={startFreq}
                        onChange={(e) => setStartFreq(e.target.value)}
                        className="w-full bg-black/40 border border-cyan-500/20 rounded-xl px-5 py-4 text-2xl text-cyan-300 focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xl font-bold text-slate-300 mb-3">End Frequency (MHz)</label>
                      <input
                        type="text"
                        value={endFreq}
                        onChange={(e) => setEndFreq(e.target.value)}
                        className="w-full bg-black/40 border border-cyan-500/20 rounded-xl px-5 py-4 text-2xl text-cyan-300 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <label className="block text-xl font-bold text-slate-300 mb-3">Scan Interval (seconds)</label>
                      <input
                        type="text"
                        value={scanInterval}
                        onChange={(e) => setScanInterval(e.target.value)}
                        className="w-full bg-black/40 border border-cyan-500/20 rounded-xl px-5 py-4 text-2xl text-cyan-300 focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xl font-bold text-slate-300 mb-3">FFT Window Size</label>
                      <select
                        value={fftSize}
                        onChange={(e) => setFftSize(e.target.value)}
                        className="w-full bg-black/40 border border-cyan-500/20 rounded-xl px-5 py-4 text-2xl text-cyan-300 focus:outline-none focus:border-cyan-400"
                      >
                        <option value="512">512 bins</option>
                        <option value="1024">1024 bins</option>
                        <option value="2048">2048 bins</option>
                        <option value="4096">4096 bins</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <label className="block text-xl font-bold text-slate-300 mb-3">Sample Rate (MSps)</label>
                      <input
                        type="text"
                        value={sampleRate}
                        onChange={(e) => setSampleRate(e.target.value)}
                        className="w-full bg-black/40 border border-cyan-500/20 rounded-xl px-5 py-4 text-2xl text-cyan-300 focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xl font-bold text-slate-300 mb-3">Tuning LNA Gain (dB)</label>
                      <input
                        type="text"
                        value={gain}
                        onChange={(e) => setGain(e.target.value)}
                        className="w-full bg-black/40 border border-cyan-500/20 rounded-xl px-5 py-4 text-2xl text-cyan-300 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  <div className="pt-6">
                    <Button type="submit" className="w-full py-8 text-2xl font-black bg-cyan-500 hover:bg-cyan-400 text-black rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all duration-300">
                      Save Parameters
                    </Button>
                  </div>

                  {saved && (
                    <div className="text-center text-xl text-green-400 font-bold animate-pulse">
                      Configuration updated successfully on ingestion node.
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>

            {/* System Info Card */}
            <Card className="p-8 border-cyan-500/10 bg-[#07111f] shadow-[0_0_50px_rgba(0,255,255,0.02)] flex flex-col justify-between">
              <div>
                <CardHeader className="flex flex-row items-center gap-4 mb-6">
                  <Server className="h-9 w-9 text-purple-300" />
                  <CardTitle className="text-4xl font-black">System Architecture Node</CardTitle>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="flex justify-between items-center border-b border-white/5 pb-4 text-xl">
                    <span className="text-slate-400 font-medium">Platform</span>
                    <span className="text-white font-bold">RF-INTEL v1.0.0 (Ubuntu ARM64)</span>
                  </div>

                  <div className="flex justify-between items-center border-b border-white/5 pb-4 text-xl">
                    <span className="text-slate-400 font-medium">Backend Status</span>
                    <span className="text-green-400 font-bold flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-400 animate-pulse" />
                      ONLINE
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-b border-white/5 pb-4 text-xl">
                    <span className="text-slate-400 font-medium">SDR Receiver</span>
                    <span className="text-cyan-300 font-bold flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-cyan-400 animate-pulse" />
                      REPLAY MODE (active)
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-b border-white/5 pb-4 text-xl">
                    <span className="text-slate-400 font-medium">Postgres DB</span>
                    <span className="text-green-400 font-bold flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-400 animate-pulse" />
                      CONNECTED
                    </span>
                  </div>

                  {/* Resource Usage */}
                  <div className="space-y-6 pt-6">
                    <h3 className="text-2xl font-black text-white">Ingestion Metrics</h3>

                    <div className="space-y-2">
                      <div className="flex justify-between text-lg text-slate-400 font-medium">
                        <span>CPU Utilization</span>
                        <span>24%</span>
                      </div>
                      <div className="w-full bg-black/40 h-3 rounded-full overflow-hidden border border-white/5">
                        <div className="bg-cyan-500 h-full rounded-full" style={{ width: "24%" }} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-lg text-slate-400 font-medium">
                        <span>RAM Utilization</span>
                        <span>45%</span>
                      </div>
                      <div className="w-full bg-black/40 h-3 rounded-full overflow-hidden border border-white/5">
                        <div className="bg-purple-500 h-full rounded-full" style={{ width: "45%" }} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-lg text-slate-400 font-medium">
                        <span>Network Throughput (MQTT)</span>
                        <span>12.4 kbps</span>
                      </div>
                      <div className="w-full bg-black/40 h-3 rounded-full overflow-hidden border border-white/5">
                        <div className="bg-teal-500 h-full rounded-full" style={{ width: "12%" }} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </div>

              <div className="p-6 border border-cyan-500/10 rounded-2xl bg-cyan-500/[0.02] flex items-center gap-4 mt-6">
                <Activity className="h-10 w-10 text-cyan-300 animate-pulse shrink-0" />
                <p className="text-lg text-slate-400 font-medium leading-relaxed">
                  Platform resources are optimal. Real-time inference pipelines are running with a latency of 142ms.
                </p>
              </div>
            </Card>

          </div>
        </div>
      </main>
    </div>
  );
}
