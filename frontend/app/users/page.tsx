"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield, Key, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const operators = [
  {
    name: "Dr. Elena Vance",
    role: "System Administrator & Chief Engineer",
    level: "Level 5 (ROOT)",
    status: "ACTIVE",
    avatar: "EV",
    color: "border-cyan-500/30 text-cyan-300 bg-cyan-500/10",
    scope: "Full system config, hardware telemetry controls, model deployment, API access governance."
  },
  {
    name: "Marcus Miller",
    role: "Lead Threat Intelligence Analyst",
    level: "Level 4 (SEC_ADMIN)",
    status: "ACTIVE",
    avatar: "MM",
    color: "border-purple-500/30 text-purple-300 bg-purple-500/10",
    scope: "Incident classification triggers, threat model oversight, Discord webhook routing control."
  },
  {
    name: "Aisha Rahman",
    role: "Operations Security Supervisor",
    level: "Level 3 (OPERATOR)",
    status: "STANDBY",
    avatar: "AR",
    color: "border-teal-500/30 text-teal-300 bg-teal-500/10",
    scope: "Incident log replays, telemetry spectrogram observations, model metrics tracking."
  },
  {
    name: "Devon Brooks",
    role: "Junior Signal Analyst",
    level: "Level 2 (ANALYST)",
    status: "OFFLINE",
    avatar: "DB",
    color: "border-slate-500/30 text-slate-400 bg-slate-500/5",
    scope: "Read-only access to spectrogram analysis, telemetry metrics, and model classifications."
  }
];

export default function UsersPage() {
  return (
    <div className="flex min-h-screen bg-[#050816] text-white">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Topbar />

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Header Actions */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <Users className="h-6 w-6 text-cyan-300" />
                <h2 className="text-xl font-bold text-white">Access Governance</h2>
              </div>
              <p className="text-slate-400 text-xs mt-1 ml-9 font-semibold">
                Manage operator accounts, security credentials, and access scopes.
              </p>
            </div>
            <Button className="py-2 px-4 text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.25)] flex items-center gap-2 transition-all duration-300 hover:scale-[1.02]">
              <Plus className="h-4.5 w-4.5 stroke-[2.5]" />
              Provision Operator
            </Button>
          </div>

          {/* Core Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {/* Operators Directory */}
            <Card className="p-5 border-cyan-500/10 bg-[#07111f] shadow-[0_0_50px_rgba(0,255,255,0.02)] rounded-[1.5rem] xl:col-span-2">
              <CardHeader className="mb-4">
                <CardTitle className="text-lg font-bold text-white">Active Operator Directory</CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {operators.map((op, idx) => (
                  <div 
                    key={op.name}
                    className="border border-white/5 bg-black/20 rounded-xl p-4.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-300 hover:border-cyan-500/20 hover:bg-white/[0.01]"
                  >
                    {/* Left details */}
                    <div className="flex items-start gap-4">
                      <div className={`h-11 w-11 rounded-xl border flex items-center justify-center text-base font-bold shrink-0 shadow-lg ${op.color}`}>
                        {op.avatar}
                      </div>
                      <div className="space-y-1">
                        <div className="text-base font-bold text-white flex items-center gap-2 flex-wrap">
                          <span>{op.name}</span>
                          <span className="text-slate-555 text-xs font-semibold tracking-wider font-mono px-2 py-0.5 bg-black/40 rounded-full border border-white/5">
                            {op.level}
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs font-semibold">{op.role}</p>
                        <p className="text-slate-500 text-xs font-medium pt-1.5 max-w-[600px] leading-relaxed">{op.scope}</p>
                      </div>
                    </div>

                    {/* Right details */}
                    <div className="flex flex-col items-end gap-2 shrink-0 self-end md:self-auto">
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold tracking-widest font-mono ${
                        op.status === "ACTIVE" 
                          ? "border-green-500/20 bg-green-500/10 text-green-300"
                          : op.status === "STANDBY"
                          ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-300"
                          : "border-slate-500/20 bg-slate-500/5 text-slate-500"
                      }`}>
                        {op.status === "ACTIVE" && <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />}
                        {op.status}
                      </div>
                      <Button variant="outline" className="h-8 px-3.5 border-cyan-500/20 hover:border-cyan-400 bg-transparent text-cyan-300 font-bold text-xs rounded-lg">
                        Modify Scopes
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Cryptographic Key Policies */}
            <Card className="p-5 border-cyan-500/10 bg-[#07111f] shadow-[0_0_50px_rgba(0,255,255,0.02)] rounded-[1.5rem]">
              <CardHeader className="flex flex-row items-center gap-2.5 mb-4">
                <Key className="h-6 w-6 text-cyan-300 animate-pulse" />
                <CardTitle className="text-lg font-bold text-white">Cryptographic Access Keys</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border border-white/5 bg-black/25 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold text-sm">HiveMQ MQTTS SSL/TLS Cert</span>
                    <span className="text-green-400 font-bold text-xs tracking-wide font-mono bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">VALID</span>
                  </div>
                  <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                    X.509 SHA-256 TLS public key certificate deployed to edge adapter loops. Rotation scheduled in 45 days.
                  </p>
                </div>

                <div className="border border-white/5 bg-black/25 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold text-sm">Discord Webhook Token</span>
                    <span className="text-green-400 font-bold text-xs tracking-wide font-mono bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">ACTIVE</span>
                  </div>
                  <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                    Webhook alert token registered under active configurations. Successfully authenticated via Discord channels.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Security Audit Log */}
            <Card className="p-5 border-cyan-500/10 bg-[#07111f] shadow-[0_0_50px_rgba(0,255,255,0.02)] rounded-[1.5rem]">
              <CardHeader className="flex flex-row items-center gap-2.5 mb-4">
                <Shield className="h-6 w-6 text-cyan-300" />
                <CardTitle className="text-lg font-bold text-white">Security Access Audits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { desc: "Operator Elena Vance switched system runtime to Random Forest model.", time: "05:12:05", status: "SUCCESS" },
                  { desc: "Root login established from verified operator subnet: 192.168.1.42.", time: "04:58:30", status: "SUCCESS" },
                  { desc: "TLS access handshake established with edge node #001.", time: "04:22:15", status: "SUCCESS" },
                ].map((log, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs border-b border-white/5 pb-2.5 last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <p className="text-slate-300 font-semibold leading-normal">{log.desc}</p>
                      <p className="text-slate-500 text-[10px] font-semibold font-mono">{log.time}</p>
                    </div>
                    <span className="text-emerald-400 text-[10px] font-bold font-mono tracking-wider px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full shrink-0 ml-4">
                      {log.status}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

          </div>
        </div>
      </main>
    </div>
  );
}
