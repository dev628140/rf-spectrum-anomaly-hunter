"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { Shield, Key, User, ArrowRight, Eye, EyeOff, Radio, Plus, CheckCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export default function LoginPage() {
  const { login } = useAuthStore();
  const [mode, setMode] = useState<"login" | "signup" | "details">("login");
  
  // Login State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Signup State (Step 1)
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRoleType, setRegRoleType] = useState<"admin" | "operator">("operator");
  
  // Profile Details State (Step 2)
  const [fullName, setFullName] = useState("");
  const [roleDesc, setRoleDesc] = useState("");
  const [accessScope, setAccessScope] = useState("");
  
  const [errorMsg, setErrorMsg] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg("Authentication credentials required.");
      return;
    }

    setIsAuthenticating(true);
    setErrorMsg("");

    try {
      const res = await api.post("/api/auth/login", {
        username: username.trim(),
        password: password.trim()
      });
      
      if (res.data && res.data.status === "SUCCESS") {
        const u = res.data.user;
        login({
          username: u.username,
          name: u.name,
          role: u.level.includes("ROOT") || u.level.includes("ADMIN") ? "admin" : "user",
          level: u.level,
          avatar: u.avatar,
          color: u.color,
          scope: u.scope
        });
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Access Denied: Invalid credentials.");
      setIsAuthenticating(false);
    }
  };

  const handleAdminDirectLogin = async () => {
    setIsAuthenticating(true);
    setErrorMsg("");
    try {
      const res = await api.post("/api/auth/login", {
        username: "admin",
        password: "admin"
      });
      if (res.data && res.data.status === "SUCCESS") {
        const u = res.data.user;
        login({
          username: u.username,
          name: u.name,
          role: "admin",
          level: u.level,
          avatar: u.avatar,
          color: u.color,
          scope: u.scope
        });
      }
    } catch (err: any) {
      // Fallback in case seed database is absent during testing
      login({
        username: "admin",
        name: "Dr. Elena Vance",
        role: "admin",
        level: "Level 5 (ROOT)",
        avatar: "EV",
        color: "border-cyan-500/30 text-cyan-300 bg-cyan-500/10",
        scope: "Full system config, hardware telemetry controls, model deployment, API access governance."
      });
    }
  };

  const handleSignupNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername.trim() || !regPassword.trim()) {
      setErrorMsg("Username and password are required.");
      return;
    }
    setErrorMsg("");
    setMode("details");
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !roleDesc.trim()) {
      setErrorMsg("Full Name and Role Description are required.");
      return;
    }

    setIsAuthenticating(true);
    setErrorMsg("");

    const level = regRoleType === "admin" ? "Level 5 (ROOT)" : "Level 3 (OPERATOR)";

    try {
      const res = await api.post("/api/auth/signup", {
        username: regUsername.trim(),
        password: regPassword.trim(),
        name: fullName.trim(),
        role: roleDesc.trim(),
        level: level,
        scope: accessScope.trim()
      });

      if (res.data && res.data.status === "SUCCESS") {
        const u = res.data.user;
        login({
          username: u.username,
          name: u.name,
          role: regRoleType === "admin" ? "admin" : "user",
          level: u.level,
          avatar: u.avatar,
          color: u.color,
          scope: u.scope
        });
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Signup failed. Username may be taken.");
      setIsAuthenticating(false);
      setMode("signup"); // Go back to credentials step if error
    }
  };

  const handleQuickLoginGuest = () => {
    setIsAuthenticating(true);
    setErrorMsg("");
    setTimeout(() => {
      login({
        username: "guest_ops",
        name: "Guest Operator",
        role: "guest",
        level: "Level 1 (GUEST)",
        avatar: "GO",
        color: "border-slate-500/30 text-slate-400 bg-slate-500/5",
        scope: "Read-only access to standard RF spectrum indicators."
      });
    }, 400);
  };

  return (
    <div className="relative min-h-screen w-screen bg-[#050816] flex flex-col justify-center items-center p-4 overflow-hidden font-semibold">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.012)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.01] to-transparent h-full w-full pointer-events-none animate-radar-sweep select-none" />
      <div className="absolute top-1/4 left-1/3 w-[350px] h-[350px] bg-cyan-500/5 rounded-full filter blur-[80px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/3 w-[350px] h-[350px] bg-purple-500/5 rounded-full filter blur-[80px] pointer-events-none animate-pulse" />

      {/* Main Login Console Card */}
      <div className="w-full max-w-[440px] border border-cyan-500/20 bg-[#07111f]/80 backdrop-blur-xl shadow-[0_0_50px_rgba(6,182,212,0.15)] rounded-[2rem] p-8 z-10 space-y-6 relative overflow-hidden transition-all duration-300 hover:border-cyan-500/30">
        
        {/* Banner Header */}
        <div className="text-center space-y-2 relative">
          <div className="flex justify-center mb-1">
            <div className="h-12 w-12 rounded-2xl border border-cyan-400 bg-cyan-500/10 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <Radio className="h-6 w-6 text-cyan-300 animate-pulse" />
            </div>
          </div>
          <h2 className="text-xl font-black text-white tracking-widest uppercase font-mono">
            RF INTEL PLATFORM
          </h2>
          <p className="text-slate-400 text-xs font-mono font-bold uppercase tracking-wider">
            {mode === "login" ? "Security Ingress Console" : mode === "signup" ? "Access Provision Request" : "Personal Profiling Setup"}
          </p>
          <div className="h-0.5 w-16 bg-cyan-500/40 mx-auto rounded-full mt-2" />
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-bold font-mono rounded-xl flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-ping shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* --- LOGIN MODE --- */}
        {mode === "login" && (
          <>
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono">Username</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Secure Username"
                    className="w-full bg-black/40 border border-white/5 hover:border-cyan-500/20 focus:border-cyan-500 rounded-xl pl-10.5 pr-4 py-2.5 text-sm text-white focus:outline-none transition-all duration-300 placeholder-slate-600 font-semibold"
                    disabled={isAuthenticating}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono">Password</label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Access Key Signature"
                    className="w-full bg-black/40 border border-white/5 hover:border-cyan-500/20 focus:border-cyan-500 rounded-xl pl-10.5 pr-10 py-2.5 text-sm text-white focus:outline-none transition-all duration-300 placeholder-slate-600 font-semibold"
                    disabled={isAuthenticating}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 h-4 w-4 text-slate-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={isAuthenticating}
                  className="flex-1 py-3.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.2)] flex items-center justify-center gap-1.5"
                >
                  {isAuthenticating ? (
                    <span className="h-3.5 w-3.5 border-2 border-black border-t-transparent animate-spin rounded-full" />
                  ) : (
                    <>
                      Link Access
                      <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* SEPARATE ADMIN LOGIN BUTTON */}
            <div className="pt-1">
              <Button
                type="button"
                onClick={handleAdminDirectLogin}
                disabled={isAuthenticating}
                className="w-full py-3.5 border border-red-500/30 hover:border-red-500 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-black text-xs uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Shield className="h-4 w-4 text-red-400 animate-pulse" />
                System Root Admin Access
              </Button>
            </div>

            <div className="flex justify-between items-center text-xs font-mono font-bold pt-2 border-t border-white/5">
              <button 
                type="button" 
                onClick={() => { setErrorMsg(""); setMode("signup"); }}
                className="text-cyan-400 hover:text-cyan-300 transition-all flex items-center gap-0.5"
              >
                <Plus className="h-3.5 w-3.5" /> Request Sign Up
              </button>
            </div>
          </>
        )}

        {/* --- SIGNUP MODE (Step 1) --- */}
        {mode === "signup" && (
          <form onSubmit={handleSignupNext} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono">Create Username</label>
              <input
                type="text"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                placeholder="e.g. freeman42"
                required
                className="w-full bg-black/40 border border-white/5 hover:border-cyan-500/20 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition-all placeholder-slate-650 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono">Create Password</label>
              <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-black/40 border border-white/5 hover:border-cyan-500/20 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition-all placeholder-slate-650 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono">Assign Clearance Level</label>
              <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
                <button
                  type="button"
                  onClick={() => setRegRoleType("operator")}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    regRoleType === "operator" 
                      ? "border-teal-500 bg-teal-500/10 text-teal-300"
                      : "border-white/5 bg-black/20 text-slate-400 hover:text-white"
                  }`}
                >
                  <User className="h-4.5 w-4.5" />
                  <span>Level 3 OPERATOR</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setRegRoleType("admin")}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    regRoleType === "admin" 
                      ? "border-red-500 bg-red-500/10 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.1)]"
                      : "border-white/5 bg-black/20 text-slate-400 hover:text-white"
                  }`}
                >
                  <Shield className="h-4.5 w-4.5" />
                  <span>Level 5 ADMIN</span>
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                onClick={() => { setErrorMsg(""); setMode("login"); }}
                className="flex-1 py-3.5 bg-transparent border border-white/10 hover:border-white/20 text-slate-350 text-xs font-bold rounded-xl"
              >
                Back to Logon
              </Button>
              
              <Button
                type="submit"
                className="flex-1 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-1 hover:scale-[1.01]"
              >
                Next Step
                <ChevronRight className="h-4.5 w-4.5 stroke-[2.5]" />
              </Button>
            </div>
          </form>
        )}

        {/* --- DETAILS MODE (Step 2) --- */}
        {mode === "details" && (
          <form onSubmit={handleSignupSubmit} className="space-y-4 font-semibold">
            <div className="p-3 bg-cyan-500/5 border border-cyan-500/20 text-cyan-300 text-[10px] font-mono rounded-xl leading-relaxed">
              ACCOUNT SIGNUP CREATED. PLEASE SPECIFY YOUR OPERATOR RECORD DETAILS TO COMPLETE INGRESS INSTRUCTIONS.
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Dr. Gordon Freeman"
                required
                disabled={isAuthenticating}
                className="w-full bg-black/40 border border-white/5 hover:border-cyan-500/20 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition-all placeholder-slate-650 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono">Role Description</label>
              <input
                type="text"
                value={roleDesc}
                onChange={(e) => setRoleDesc(e.target.value)}
                placeholder="e.g. Ingestion Core Supervisor"
                required
                disabled={isAuthenticating}
                className="w-full bg-black/40 border border-white/5 hover:border-cyan-500/20 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition-all placeholder-slate-650 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono">Access Scope constraints</label>
              <textarea
                value={accessScope}
                onChange={(e) => setAccessScope(e.target.value)}
                placeholder="Describe scopes and frequency band clearances (e.g. Ingestion loop #03 monitor)"
                rows={2}
                disabled={isAuthenticating}
                className="w-full bg-black/40 border border-white/5 hover:border-cyan-500/20 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition-all placeholder-slate-650 font-semibold resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                onClick={() => setMode("signup")}
                disabled={isAuthenticating}
                className="flex-1 py-3.5 bg-transparent border border-white/10 hover:border-white/20 text-slate-350 text-xs font-bold rounded-xl"
              >
                Back
              </Button>
              
              <Button
                type="submit"
                disabled={isAuthenticating}
                className="flex-1 py-3.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-black font-black text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-1 hover:scale-[1.01]"
              >
                {isAuthenticating ? (
                  <span className="h-3.5 w-3.5 border-2 border-black border-t-transparent animate-spin rounded-full" />
                ) : (
                  <>
                    Deploy Ingress
                    <CheckCircle className="h-4.5 w-4.5" />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Separator (Only shown during basic login) */}
        {mode === "login" && (
          <>
            <div className="relative flex items-center justify-center my-2 shrink-0">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5" />
              </div>
              <span className="relative px-3 bg-[#07111f] text-slate-500 text-[9px] font-bold tracking-widest uppercase font-mono">
                Or Guest Access
              </span>
            </div>

            {/* Guest Bypass Button */}
            <div className="font-mono text-[9px] font-black">
              <button
                type="button"
                onClick={handleQuickLoginGuest}
                disabled={isAuthenticating}
                className="w-full border border-slate-500/25 hover:border-slate-400 bg-slate-500/5 hover:bg-slate-500/10 text-slate-400 hover:text-white p-3 rounded-xl transition-all duration-200 hover:scale-[1.01] flex items-center gap-2 justify-center shadow-lg"
              >
                <Eye className="h-4.5 w-4.5 text-slate-400" />
                <span>CONTINUE AS GUEST (READ-ONLY)</span>
              </button>
            </div>
          </>
        )}

        <div className="text-center font-mono text-[8px] text-slate-550 pt-2 tracking-widest uppercase">
          SECURE ENCRYPTED NODE CONNECTION
        </div>
      </div>
    </div>
  );
}
