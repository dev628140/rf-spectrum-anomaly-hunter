"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { Shield, Key, User, ArrowRight, Eye, EyeOff, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const { login } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg("Authentication credentials required.");
      return;
    }

    setIsAuthenticating(true);
    setErrorMsg("");

    setTimeout(() => {
      const uLower = username.trim().toLowerCase();
      const pLower = password.trim().toLowerCase();

      if (uLower === "admin" && pLower === "admin") {
        login("Dr. Elena Vance", "admin");
      } else if (uLower === "user" && pLower === "user") {
        login("Marcus Miller", "user");
      } else {
        setErrorMsg("Access Denied: Invalid credentials.");
        setIsAuthenticating(false);
      }
    }, 800);
  };

  const handleQuickLogin = (role: "admin" | "user" | "guest") => {
    setIsAuthenticating(true);
    setErrorMsg("");
    setTimeout(() => {
      if (role === "admin") {
        login("Dr. Elena Vance", "admin");
      } else if (role === "user") {
        login("Marcus Miller", "user");
      } else {
        login("Guest Operator", "guest");
      }
    }, 500);
  };

  return (
    <div className="relative min-h-screen w-screen bg-[#050816] flex flex-col justify-center items-center p-4 overflow-hidden font-semibold">
      {/* Cybersecurity Cyber Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.012)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      
      {/* Futuristic Scanline Animation */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.01] to-transparent h-full w-full pointer-events-none animate-radar-sweep select-none" />
      
      {/* Background Glowing Orb Blurs */}
      <div className="absolute top-1/4 left-1/3 w-[350px] h-[350px] bg-cyan-500/5 rounded-full filter blur-[80px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/3 w-[350px] h-[350px] bg-purple-500/5 rounded-full filter blur-[80px] pointer-events-none animate-pulse" />

      {/* Main Login Console Card */}
      <div className="w-full max-w-[440px] border border-cyan-500/20 bg-[#07111f]/80 backdrop-blur-xl shadow-[0_0_50px_rgba(6,182,212,0.15)] rounded-[2rem] p-8 z-10 space-y-6 relative overflow-hidden transition-all duration-300 hover:border-cyan-500/30">
        
        {/* Neon Terminal Banner Header */}
        <div className="text-center space-y-2 relative">
          <div className="flex justify-center mb-1">
            <div className="h-12 w-12 rounded-2xl border border-cyan-400 bg-cyan-500/10 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.25)] relative group overflow-hidden">
              <Radio className="h-6 w-6 text-cyan-300 animate-pulse" />
              <div className="absolute inset-0 bg-cyan-400/5 rotate-45 translate-y-12 transition-all duration-700 group-hover:translate-y-[-50px]" />
            </div>
          </div>
          <h2 className="text-xl font-black text-white tracking-widest uppercase font-mono">
            RF INTEL PLATFORM
          </h2>
          <p className="text-slate-400 text-xs font-mono font-bold uppercase tracking-wider">
            Operational Security Logon
          </p>
          <div className="h-0.5 w-16 bg-cyan-500/40 mx-auto rounded-full mt-2" />
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-bold font-mono rounded-xl animate-shake flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-ping shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono">Username</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Secure ID (e.g. admin)"
                className="w-full bg-black/40 border border-white/5 hover:border-cyan-500/20 focus:border-cyan-500 rounded-xl pl-10.5 pr-4 py-2.5 text-sm text-white focus:outline-none transition-all duration-300 font-semibold placeholder-slate-600"
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
                placeholder="Access Hash (e.g. admin)"
                className="w-full bg-black/40 border border-white/5 hover:border-cyan-500/20 focus:border-cyan-500 rounded-xl pl-10.5 pr-10 py-2.5 text-sm text-white focus:outline-none transition-all duration-300 font-semibold placeholder-slate-600"
                disabled={isAuthenticating}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 h-4 w-4 text-slate-500 hover:text-white transition-colors"
                disabled={isAuthenticating}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isAuthenticating}
            className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_25px_rgba(6,182,212,0.35)] flex items-center justify-center gap-1.5 hover:scale-[1.01]"
          >
            {isAuthenticating ? (
              <span className="h-3.5 w-3.5 border-2 border-black border-t-transparent animate-spin rounded-full" />
            ) : (
              <>
                Initialize Link
                <ArrowRight className="h-4.5 w-4.5 stroke-[2.5]" />
              </>
            )}
          </Button>
        </form>

        {/* Separator */}
        <div className="relative flex items-center justify-center my-2 shrink-0">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5" />
          </div>
          <span className="relative px-3 bg-[#07111f] text-slate-500 text-[9px] font-bold tracking-widest uppercase font-mono">
            Or Guest Access
          </span>
        </div>

        {/* Quick Logins presets */}
        <div className="font-mono text-[9px] font-black">
          <button
            type="button"
            onClick={() => handleQuickLogin("guest")}
            disabled={isAuthenticating}
            className="w-full border border-slate-500/25 hover:border-slate-400 bg-slate-500/5 hover:bg-slate-500/10 text-slate-400 hover:text-white p-3 rounded-xl transition-all duration-200 hover:scale-[1.01] flex items-center gap-2 justify-center shadow-lg"
          >
            <Eye className="h-4.5 w-4.5 text-slate-400" />
            <span>CONTINUE AS GUEST (READ-ONLY)</span>
          </button>
        </div>

        <div className="text-center font-mono text-[8px] text-slate-550 pt-2 tracking-widest uppercase">
          SECURE ENCRYPTED NODE CONNECTION
        </div>
      </div>
    </div>
  );
}
