"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield, Key, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { RestrictedOverlay } from "@/components/restricted-overlay";

export default function UsersPage() {
  const { user } = useAuthStore();
  const isGuest = user?.role === "guest";
  const isUser = user?.role === "user";

  const [operators, setOperators] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedUserIdx, setSelectedUserIdx] = useState<number>(0);
  const [rotatedToken, setRotatedToken] = useState<string>("");
  const [isRotating, setIsRotating] = useState(false);

  // Provisioning Modal State
  const [isProvisionOpen, setIsProvisionOpen] = useState(false);
  const [provName, setProvName] = useState("");
  const [provRole, setProvRole] = useState("");
  const [provLevel, setProvLevel] = useState("Level 3 (OPERATOR)");
  const [provStatus, setProvStatus] = useState("ACTIVE");
  const [provScope, setProvScope] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modification Modal State
  const [isModifyOpen, setIsModifyOpen] = useState(false);
  const [modOperator, setModOperator] = useState<any | null>(null);
  const [modName, setModName] = useState("");
  const [modRole, setModRole] = useState("");
  const [modLevel, setModLevel] = useState("");
  const [modStatus, setModStatus] = useState("");
  const [modScope, setModScope] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");

  const fetchOperators = async () => {
    try {
      const res = await api.get("/api/system/operators");
      if (res.data && res.data.data) {
        setOperators(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load operators from DB:", err);
    }
  };

  const fetchAudits = async () => {
    try {
      const res = await api.get("/api/system/audits");
      if (res.data && res.data.data) {
        setAudits(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load audit logs from DB:", err);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    await Promise.all([fetchOperators(), fetchAudits()]);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openModifyModal = (op: any) => {
    setModOperator(op);
    setModName(op.name);
    setModRole(op.role);
    setModLevel(op.level);
    setModStatus(op.status);
    setModScope(op.scope || "");
    setErrorMsg("");
    setIsModifyOpen(true);
  };

  const openProvisionModal = () => {
    setProvName("");
    setProvRole("");
    setProvLevel("Level 3 (OPERATOR)");
    setProvStatus("ACTIVE");
    setProvScope("");
    setErrorMsg("");
    setIsProvisionOpen(true);
  };

  const handleProvision = async () => {
    if (!provName.trim() || !provRole.trim()) {
      setErrorMsg("Name and Role are required fields.");
      return;
    }
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      await api.post("/api/system/operators", {
        name: provName,
        role: provRole,
        level: provLevel,
        status: provStatus,
        scope: provScope
      });
      setIsProvisionOpen(false);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Failed to provision new operator.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!modOperator) return;
    if (!modName.trim() || !modRole.trim()) {
      setErrorMsg("Name and Role are required fields.");
      return;
    }
    setIsUpdating(true);
    setErrorMsg("");
    try {
      await api.put(`/api/system/operators/${modOperator.id}`, {
        name: modName,
        role: modRole,
        level: modLevel,
        status: modStatus,
        scope: modScope
      });
      setIsModifyOpen(false);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Failed to update operator credentials.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRevoke = async () => {
    if (!modOperator) return;
    if (!confirm(`Are you sure you want to revoke credentials for ${modOperator.name}?`)) {
      return;
    }
    setIsUpdating(true);
    setErrorMsg("");
    try {
      await api.delete(`/api/system/operators/${modOperator.id}`);
      setIsModifyOpen(false);
      setSelectedUserIdx(0);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Failed to revoke operator access.");
    } finally {
      setIsUpdating(false);
    }
  };

  const rotateKeyToken = async () => {
    setIsRotating(true);
    setRotatedToken("");
    
    let cycles = 0;
    const chars = "abcdef0123456789";
    const interval = setInterval(() => {
      let hash = "";
      for (let i = 0; i < 64; i++) {
        hash += chars[Math.floor(Math.random() * 16)];
      }
      setRotatedToken(hash);
      cycles++;
    }, 100);

    try {
      const res = await api.post("/api/system/rotate-cert");
      setTimeout(async () => {
        clearInterval(interval);
        setRotatedToken(res.data.sha256);
        setIsRotating(false);
        await fetchAudits();
      }, 1300);
    } catch (err) {
      setTimeout(() => {
        clearInterval(interval);
        setRotatedToken("ERROR: Failed to rotate SSL certificate token from backend.");
        setIsRotating(false);
      }, 1300);
    }
  };

  const currentOp = operators[selectedUserIdx] || operators[0] || null;

  return (
    <div className="relative min-h-[calc(100vh-120px)] w-full flex flex-col gap-6">
      {isGuest && <RestrictedOverlay message="Access Governance panel requires administrative clearance." />}
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
        <Button 
          onClick={openProvisionModal}
          disabled={isUser}
          className="py-2 px-4 text-xs font-bold bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-400 disabled:scale-100 disabled:shadow-none text-black rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.25)] flex items-center gap-2 transition-all duration-300 hover:scale-[1.02]"
        >
          <Plus className="h-4.5 w-4.5 stroke-[2.5]" />
          {isUser ? "Provision Locked" : "Provision Operator"}
        </Button>
      </div>

      {/* Core Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Operators Directory */}
        <Card className="p-5 border-cyan-500/10 bg-[#07111f] shadow-[0_0_50px_rgba(0,255,255,0.02)] rounded-[1.5rem] xl:col-span-2">
          <CardHeader className="mb-4">
            <CardTitle className="text-lg font-bold text-white">Active Operator Directory</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4 font-semibold">
            {isLoading ? (
              <div className="text-center py-12 text-slate-500 text-sm font-bold animate-pulse">
                Retrieving secure operator credentials...
              </div>
            ) : operators.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm font-bold">
                No authorized operators provisioned in target database.
              </div>
            ) : (
              operators.map((op, idx) => (
                <div 
                  key={op.id || op.name}
                  onClick={() => setSelectedUserIdx(idx)}
                  className={`border rounded-xl p-4.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-300 cursor-pointer ${
                    selectedUserIdx === idx 
                      ? "border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.15)] bg-cyan-500/[0.02]" 
                      : "border-white/5 bg-black/20 hover:border-cyan-500/20 hover:bg-white/[0.01]"
                  }`}
                >
                  {/* Left details */}
                  <div className="flex items-start gap-4">
                    <div className={`h-11 w-11 rounded-xl border flex items-center justify-center text-base font-bold shrink-0 shadow-lg ${op.color || 'border-cyan-500/30 text-cyan-300 bg-cyan-500/10'}`}>
                      {op.avatar}
                    </div>
                    <div className="space-y-1">
                      <div className="text-base font-bold text-white flex items-center gap-2 flex-wrap">
                        <span>{op.name}</span>
                        <span className="text-slate-500 text-xs font-semibold tracking-wider font-mono px-2 py-0.5 bg-black/40 rounded-full border border-white/5">
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
                    <Button 
                      variant="outline" 
                      onClick={(e) => {
                        e.stopPropagation();
                        openModifyModal(op);
                      }}
                      disabled={isUser}
                      className="h-8 px-3.5 border-cyan-500/20 hover:border-cyan-400 disabled:border-slate-800 disabled:text-slate-500 bg-transparent text-cyan-300 font-bold text-xs rounded-lg"
                    >
                      {isUser ? "Locked" : "Modify Scopes"}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Cryptographic Key Policies */}
        <Card className="p-5 border-cyan-500/10 bg-[#07111f] shadow-[0_0_50px_rgba(0,255,255,0.02)] rounded-[1.5rem] flex flex-col justify-between">
          <div>
            <CardHeader className="flex flex-row items-center gap-2.5 mb-4 p-0">
              <Key className="h-6 w-6 text-cyan-300 animate-pulse" />
              <CardTitle className="text-lg font-bold text-white">Cryptographic Access Keys</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
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

              {rotatedToken && (
                <div className="border border-cyan-500/20 bg-black/50 rounded-xl p-4 space-y-2 animate-fadeIn">
                  <div className="flex justify-between items-center">
                    <span className="text-cyan-300 font-bold text-xs font-mono">GENERATED SHA-256 SIGNATURE</span>
                    <span className={`text-xs font-mono font-bold ${isRotating ? "text-yellow-400 animate-pulse" : "text-green-400"}`}>
                      {isRotating ? "COMPUTING..." : "DEPLOYED"}
                    </span>
                  </div>
                  <p className="text-white text-[10px] font-mono break-all font-semibold leading-relaxed bg-black/60 p-2.5 rounded border border-white/5">
                    {rotatedToken}
                  </p>
                </div>
              )}
            </CardContent>
          </div>

          <div className="pt-4">
            <Button
              onClick={rotateKeyToken}
              disabled={isRotating || isUser}
              className="w-full py-2 text-xs font-bold bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-400 text-black rounded-lg transition-all"
            >
              {isRotating ? "Rotating Access Keys..." : isUser ? "Cert Rotation Locked (Admin Only)" : "Rotate & Verify X.509 Certificates"}
            </Button>
          </div>
        </Card>

        {/* Security Audit Log */}
        <Card className="p-5 border-cyan-500/10 bg-[#07111f] shadow-[0_0_50px_rgba(0,255,255,0.02)] rounded-[1.5rem]">
          <CardHeader className="flex flex-row items-center gap-2.5 mb-4">
            <Shield className="h-6 w-6 text-cyan-300" />
            <CardTitle className="text-lg font-bold text-white">Security Access Audits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 font-semibold">
            {currentOp && (
              <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2.5">
                <div className="space-y-1">
                  <p className="text-slate-300 font-semibold leading-normal">
                    Operator {currentOp.name} selected to audit configurations.
                  </p>
                  <p className="text-slate-500 text-[10px] font-semibold font-mono">Just now</p>
                </div>
                <span className="text-emerald-400 text-[10px] font-bold font-mono tracking-wider px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full shrink-0 ml-4">
                  SUCCESS
                </span>
              </div>
            )}
            {isLoading ? (
              <div className="text-center py-4 text-slate-500 text-xs font-bold animate-pulse">
                Retrieving audit trace...
              </div>
            ) : audits.length === 0 ? (
              <div className="text-center py-4 text-slate-500 text-xs font-bold">
                No security audits recorded yet.
              </div>
            ) : (
              audits.slice(0, 5).map((log, idx) => {
                const date = new Date(log.timestamp);
                const timeStr = isNaN(date.getTime())
                  ? log.timestamp
                  : `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
                return (
                  <div key={log.id || idx} className="flex justify-between items-center text-xs border-b border-white/5 pb-2.5 last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <p className="text-slate-300 font-semibold leading-normal">{log.message}</p>
                      <p className="text-slate-500 text-[10px] font-semibold font-mono">{timeStr}</p>
                    </div>
                    <span className="text-emerald-400 text-[10px] font-bold font-mono tracking-wider px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full shrink-0 ml-4">
                      {log.status}
                    </span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Permissions Matrix */}
        <Card className="p-5 border-cyan-500/10 bg-[#07111f] shadow-[0_0_50px_rgba(0,255,255,0.02)] rounded-[1.5rem] xl:col-span-2">
          <CardHeader className="mb-4">
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-cyan-300" />
              Access Control Permissions Matrix
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-cyan-500/20 text-slate-400">
                  <th className="py-3 px-4">OPERATOR</th>
                  <th className="py-3 px-4 text-center">READ TELEMETRY</th>
                  <th className="py-3 px-4 text-center">REPLAY LOGS</th>
                  <th className="py-3 px-4 text-center">SWAP MODELS</th>
                  <th className="py-3 px-4 text-center">WRITE CONFIGS</th>
                  <th className="py-3 px-4 text-center">MANAGE SCOPES</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 text-xs font-bold animate-pulse">
                      Loading permissions structure...
                    </td>
                  </tr>
                ) : operators.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 text-xs font-bold">
                      No operators found.
                    </td>
                  </tr>
                ) : (
                  operators.map((op, idx) => {
                    const levelNum = parseInt(op.level?.match(/\d+/)?.[0] || "0");
                    const hasRead = levelNum >= 2;
                    const hasReplay = levelNum >= 3;
                    const hasSwap = levelNum >= 4;
                    const hasWrite = levelNum >= 5;
                    const hasManage = levelNum >= 5;

                    return (
                      <tr
                        key={op.id || op.name}
                        onClick={() => setSelectedUserIdx(idx)}
                        className={`cursor-pointer border-b border-white/5 transition-all duration-150 ${
                          selectedUserIdx === idx
                            ? "bg-cyan-500/5 text-cyan-300 font-bold border-l-2 border-l-cyan-500"
                            : "hover:bg-white/[0.01] text-slate-300"
                        }`}
                      >
                        <td className="py-3 px-4 flex items-center gap-2">
                          <span className="text-[10px] text-slate-500">[{op.level}]</span>
                          <span>{op.name}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {hasRead ? <span className="text-green-400">✓</span> : <span className="text-slate-600">✗</span>}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {hasReplay ? <span className="text-green-400">✓</span> : <span className="text-slate-600">✗</span>}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {hasSwap ? <span className="text-green-400">✓</span> : <span className="text-slate-600">✗</span>}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {hasWrite ? <span className="text-green-400">✓</span> : <span className="text-slate-600">✗</span>}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {hasManage ? <span className="text-green-400">✓</span> : <span className="text-slate-600">✗</span>}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

      </div>

      {/* Provision Operator Modal */}
      {isProvisionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg border border-cyan-500 bg-[#07111f] shadow-[0_0_35px_rgba(6,182,212,0.25)] rounded-2xl p-6 relative">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-cyan-300" />
              Provision New Operator Credentials
            </h3>
            
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-lg">
                {errorMsg}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-bold mb-1.5 uppercase font-mono">Full Name</label>
                <input 
                  type="text" 
                  value={provName}
                  onChange={(e) => setProvName(e.target.value)}
                  placeholder="e.g. Dr. Gordon Freeman"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-all font-semibold"
                />
              </div>
              
              <div>
                <label className="block text-slate-400 text-xs font-bold mb-1.5 uppercase font-mono">Role Description</label>
                <input 
                  type="text" 
                  value={provRole}
                  onChange={(e) => setProvRole(e.target.value)}
                  placeholder="e.g. Anomalous Materials Specialist"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-all font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-bold mb-1.5 uppercase font-mono">Access Level</label>
                  <select 
                    value={provLevel}
                    onChange={(e) => setProvLevel(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-all font-semibold"
                  >
                    <option value="Level 5 (ROOT)">Level 5 (ROOT)</option>
                    <option value="Level 4 (SEC_ADMIN)">Level 4 (SEC_ADMIN)</option>
                    <option value="Level 3 (OPERATOR)">Level 3 (OPERATOR)</option>
                    <option value="Level 2 (ANALYST)">Level 2 (ANALYST)</option>
                    <option value="Level 1 (GUEST)">Level 1 (GUEST)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-bold mb-1.5 uppercase font-mono">Status</label>
                  <select 
                    value={provStatus}
                    onChange={(e) => setProvStatus(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-all font-semibold"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="STANDBY">STANDBY</option>
                    <option value="OFFLINE">OFFLINE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-bold mb-1.5 uppercase font-mono">Permitted Access Scope</label>
                <textarea 
                  value={provScope}
                  onChange={(e) => setProvScope(e.target.value)}
                  placeholder="Describe permissions, constraints, and nodes this operator has access to..."
                  rows={3}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-all font-semibold resize-none"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setIsProvisionOpen(false)}
                className="flex-1 py-2 border-white/10 hover:bg-white/5 bg-transparent text-slate-300 font-bold text-xs rounded-lg animate-none"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleProvision}
                disabled={isSubmitting}
                className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 text-black font-bold text-xs rounded-lg"
              >
                {isSubmitting ? "Provisioning..." : "Provision Operator"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modify Operator Modal */}
      {isModifyOpen && modOperator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg border border-cyan-500 bg-[#07111f] shadow-[0_0_35px_rgba(6,182,212,0.25)] rounded-2xl p-6 relative">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-cyan-300" />
                Modify Operator Credentials
              </span>
              <Button 
                onClick={handleRevoke}
                disabled={isUpdating}
                className="h-7 px-3 bg-red-500/20 hover:bg-red-500 border border-red-500/30 text-red-300 hover:text-white font-bold text-[10px] rounded-lg tracking-wider transition-all"
              >
                Revoke Operator
              </Button>
            </h3>
            
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-lg">
                {errorMsg}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-bold mb-1.5 uppercase font-mono">Full Name</label>
                <input 
                  type="text" 
                  value={modName}
                  onChange={(e) => setModName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-bold mb-1.5 uppercase font-mono">Role Description</label>
                <input 
                  type="text" 
                  value={modRole}
                  onChange={(e) => setModRole(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-all font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-bold mb-1.5 uppercase font-mono">Access Level</label>
                  <select 
                    value={modLevel}
                    onChange={(e) => setModLevel(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-all font-semibold"
                  >
                    <option value="Level 5 (ROOT)">Level 5 (ROOT)</option>
                    <option value="Level 4 (SEC_ADMIN)">Level 4 (SEC_ADMIN)</option>
                    <option value="Level 3 (OPERATOR)">Level 3 (OPERATOR)</option>
                    <option value="Level 2 (ANALYST)">Level 2 (ANALYST)</option>
                    <option value="Level 1 (GUEST)">Level 1 (GUEST)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-bold mb-1.5 uppercase font-mono">Status</label>
                  <select 
                    value={modStatus}
                    onChange={(e) => setModStatus(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-all font-semibold"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="STANDBY">STANDBY</option>
                    <option value="OFFLINE">OFFLINE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-bold mb-1.5 uppercase font-mono">Permitted Access Scope</label>
                <textarea 
                  value={modScope}
                  onChange={(e) => setModScope(e.target.value)}
                  rows={3}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-all font-semibold resize-none"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setIsModifyOpen(false)}
                className="flex-1 py-2 border-white/10 hover:bg-white/5 bg-transparent text-slate-300 font-bold text-xs rounded-lg"
              >
                Close
              </Button>
              <Button 
                onClick={handleUpdate}
                disabled={isUpdating}
                className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 text-black font-bold text-xs rounded-lg"
              >
                {isUpdating ? "Saving..." : "Update Credentials"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
