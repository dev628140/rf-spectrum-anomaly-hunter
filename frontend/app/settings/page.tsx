"use client";

import { useState, useEffect, useRef } from "react";
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

  const [diagStatus, setDiagStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [diagLogs, setDiagLogs] = useState<string[]>([]);
  const consoleEndRef = useRef<HTMLDivElement | null>(null);

  const runDiagnostics = () => {
    setDiagStatus("running");
    setDiagLogs(["[INFO] Initializing SDR Core Diagnostic Suite..."]);
    
    const steps = [
      { msg: "[CHECK] Verifying PLL Clock Lock status...", delay: 600 },
      { msg: "[SUCCESS] PLL Clock Locked (Ref: 10.000 MHz)", delay: 1200 },
      { msg: "[CHECK] Calibrating DC Offset compensation...", delay: 1800 },
      { msg: "[SUCCESS] IQ DC offset corrected (I: -0.002, Q: +0.001)", delay: 2400 },
      { msg: "[CHECK] Initializing DMA transfer buffers...", delay: 3000 },
      { msg: "[SUCCESS] DMA circular buffers allocated (64MB @ 0x800000)", delay: 3600 },
      { msg: "[CHECK] Reading frontend thermal sensors...", delay: 4200 },
      { msg: "[SUCCESS] Core temp: 42.6°C (Limits: < 85°C)", delay: 4800 },
      { msg: "[SUCCESS] Core Diagnostics completed successfully. Hardware status: HEALTHY.", delay: 5400 }
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        setDiagLogs((prev) => [...prev, step.msg]);
        if (index === steps.length - 1) {
          setDiagStatus("success");
        }
      }, step.delay);
    });
  };

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [diagLogs]);

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

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {/* RF Parameters Card */}
            <Card className="p-5 border-cyan-500/10 bg-[#07111f] shadow-[0_0_50px_rgba(0,255,255,0.02)] rounded-[1.5rem]">
              <CardHeader className="flex flex-row items-center gap-2.5 mb-4">
                <Settings className="h-6 w-6 text-cyan-300" />
                <CardTitle className="text-xl font-bold">RF Parameter Settings</CardTitle>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Start Frequency (MHz)</label>
                      <input
                        type="text"
                        value={startFreq}
                        onChange={(e) => setStartFreq(e.target.value)}
                        className="w-full bg-black/40 border border-cyan-500/20 rounded-xl px-3 py-2 text-sm text-cyan-300 focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">End Frequency (MHz)</label>
                      <input
                        type="text"
                        value={endFreq}
                        onChange={(e) => setEndFreq(e.target.value)}
                        className="w-full bg-black/40 border border-cyan-500/20 rounded-xl px-3 py-2 text-sm text-cyan-300 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Scan Interval (seconds)</label>
                      <input
                        type="text"
                        value={scanInterval}
                        onChange={(e) => setScanInterval(e.target.value)}
                        className="w-full bg-black/40 border border-cyan-500/20 rounded-xl px-3 py-2 text-sm text-cyan-300 focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">FFT Window Size</label>
                      <select
                        value={fftSize}
                        onChange={(e) => setFftSize(e.target.value)}
                        className="w-full bg-black/40 border border-cyan-500/20 rounded-xl px-3 py-2 text-sm text-cyan-300 focus:outline-none focus:border-cyan-400"
                      >
                        <option value="512">512 bins</option>
                        <option value="1024">1024 bins</option>
                        <option value="2048">2048 bins</option>
                        <option value="4096">4096 bins</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Sample Rate (MSps)</label>
                      <input
                        type="text"
                        value={sampleRate}
                        onChange={(e) => setSampleRate(e.target.value)}
                        className="w-full bg-black/40 border border-cyan-500/20 rounded-xl px-3 py-2 text-sm text-cyan-300 focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tuning LNA Gain (dB)</label>
                      <input
                        type="text"
                        value={gain}
                        onChange={(e) => setGain(e.target.value)}
                        className="w-full bg-black/40 border border-cyan-500/20 rounded-xl px-3 py-2 text-sm text-cyan-300 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button type="submit" className="w-full py-2.5 text-sm font-bold bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.25)] transition-all duration-300">
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
            <Card className="p-5 border-cyan-500/10 bg-[#07111f] shadow-[0_0_50px_rgba(0,255,255,0.02)] rounded-[1.5rem] flex flex-col justify-between">
              <div>
                <CardHeader className="flex flex-row items-center gap-2.5 mb-4">
                  <Server className="h-6 w-6 text-purple-300" />
                  <CardTitle className="text-xl font-bold">System Architecture Node</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2.5 text-sm">
                    <span className="text-slate-400 font-medium">Platform</span>
                    <span className="text-white font-bold">RF-INTEL v1.0.0 (Ubuntu ARM64)</span>
                  </div>

                  <div className="flex justify-between items-center border-b border-white/5 pb-2.5 text-sm">
                    <span className="text-slate-400 font-medium">Backend Status</span>
                    <span className="text-green-400 font-bold flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                      ONLINE
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-b border-white/5 pb-2.5 text-sm">
                    <span className="text-slate-400 font-medium">SDR Receiver</span>
                    <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                      REPLAY MODE (active)
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-b border-white/5 pb-2.5 text-sm">
                    <span className="text-slate-400 font-medium">Postgres DB</span>
                    <span className="text-green-400 font-bold flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                      CONNECTED
                    </span>
                  </div>

                  {/* Resource Usage */}
                  <div className="space-y-4 pt-4">
                    <h3 className="text-sm font-bold text-white">Ingestion Metrics</h3>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-400 font-medium">
                        <span>CPU Utilization</span>
                        <span>24%</span>
                      </div>
                      <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-white/5">
                        <div className="bg-cyan-500 h-full rounded-full" style={{ width: "24%" }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-400 font-medium">
                        <span>RAM Utilization</span>
                        <span>45%</span>
                      </div>
                      <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-white/5">
                        <div className="bg-purple-500 h-full rounded-full" style={{ width: "45%" }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-400 font-medium">
                        <span>Network Throughput (MQTT)</span>
                        <span>12.4 kbps</span>
                      </div>
                      <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-white/5">
                        <div className="bg-teal-500 h-full rounded-full" style={{ width: "12%" }} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </div>

              <div className="p-4 border border-cyan-500/10 rounded-xl bg-cyan-500/[0.02] flex items-center gap-2.5 mt-4">
                <Activity className="h-6 w-6 text-cyan-300 animate-pulse shrink-0" />
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  Platform resources are optimal. Real-time inference pipelines are running with a latency of 142ms.
                </p>
              </div>
            </Card>

            {/* Core Diagnostics Console Card */}
            <Card className="p-5 border-cyan-500/10 bg-[#07111f] shadow-[0_0_50px_rgba(0,255,255,0.02)] rounded-[1.5rem] xl:col-span-2">
              <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <Activity className="h-6 w-6 text-yellow-400" />
                  <CardTitle className="text-xl font-bold">SDR Hardware Core Diagnostics</CardTitle>
                </div>
                <div className="flex items-center gap-3">
                  {diagStatus === "running" && (
                    <span className="flex items-center gap-1.5 text-xs text-yellow-400 font-bold font-mono">
                      <span className="h-2 w-2 rounded-full bg-yellow-400 animate-ping" />
                      RUNNING DIAGS
                    </span>
                  )}
                  {diagStatus === "success" && (
                    <span className="flex items-center gap-1.5 text-xs text-green-400 font-bold font-mono">
                      <span className="h-2 w-2 rounded-full bg-green-400" />
                      SYSTEM HEALTHY
                    </span>
                  )}
                  {diagStatus === "idle" && (
                    <span className="flex items-center gap-1.5 text-xs text-slate-400 font-bold font-mono">
                      <span className="h-2 w-2 rounded-full bg-slate-400" />
                      READY
                    </span>
                  )}
                  <Button
                    onClick={runDiagnostics}
                    disabled={diagStatus === "running"}
                    className="py-1.5 px-4 text-xs font-bold bg-yellow-500 hover:bg-yellow-400 disabled:bg-slate-700 text-black rounded-lg transition-all"
                  >
                    Run Core Diagnostics
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Diagnostics Checklist */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white mb-2">Hardware Verification Checklist</h3>
                  <div className="space-y-3">
                    {[
                      { id: "pll", label: "PLL clock synthesis calibration check" },
                      { id: "dc", label: "IQ balance and DC offset calibration" },
                      { id: "dma", label: "DMA buffer allocation & alignment test" },
                      { id: "thermal", label: "Front-end RF core thermistors scan" }
                    ].map((item, idx) => {
                      let statusText = "Pending";
                      let color = "text-slate-500";
                      let indicator = "○";

                      if (diagStatus === "running") {
                        if (diagLogs.some(log => log.includes("SUCCESS") && log.includes(item.id === "pll" ? "PLL" : item.id === "dc" ? "corrected" : item.id === "dma" ? "DMA" : "temp"))) {
                          statusText = "Passed";
                          color = "text-green-400 font-bold";
                          indicator = "●";
                        } else if (diagLogs.some(log => log.includes("CHECK") && log.includes(item.id === "pll" ? "PLL" : item.id === "dc" ? "DC" : item.id === "dma" ? "DMA" : "thermal"))) {
                          statusText = "Checking...";
                          color = "text-yellow-400 font-bold animate-pulse";
                          indicator = "◑";
                        }
                      } else if (diagStatus === "success") {
                        statusText = "Passed";
                        color = "text-green-400 font-bold";
                        indicator = "●";
                      }

                      return (
                        <div key={item.id} className="flex justify-between items-center border-b border-white/5 pb-2 text-xs">
                          <span className="text-slate-300 font-medium flex items-center gap-2">
                            <span className={color}>{indicator}</span>
                            {item.label}
                          </span>
                          <span className={color}>{statusText}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Rolling Log Output */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-white">Diagnostics Console Log</h3>
                    <button
                      onClick={() => setDiagLogs([])}
                      className="text-[10px] text-slate-500 hover:text-white font-bold"
                    >
                      CLEAR
                    </button>
                  </div>
                  <div className="bg-black/80 font-mono text-[11px] p-4 rounded-xl text-green-400 border border-green-500/20 max-h-48 overflow-y-auto h-48 space-y-1">
                    {diagLogs.length === 0 ? (
                      <span className="text-slate-600 font-mono">[LOG] Awaiting diagnostic execution command...</span>
                    ) : (
                      diagLogs.map((log, idx) => (
                        <div key={idx} className={log.includes("SUCCESS") ? "text-green-400" : log.includes("CHECK") ? "text-yellow-300" : "text-cyan-300"}>
                          {log}
                        </div>
                      ))
                    )}
                    <div ref={consoleEndRef} />
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </main>
    </div>
  );
}
