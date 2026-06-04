"use client";

import { useState } from "react";
import { Shield, Lock, Check, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

export function RestrictedOverlay({ 
  message = "Root-level clearance required.",
  featureKey
}: { 
  message?: string;
  featureKey?: string;
}) {
  const { user } = useAuthStore();
  const [requestStatus, setRequestStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleRequestAccess = async () => {
    if (!user || !featureKey) return;
    setRequestStatus("loading");
    setErrorMsg("");
    try {
      await api.post("/api/system/access-requests", {
        username: user.username,
        requested_feature: featureKey
      });
      setRequestStatus("success");
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Failed to submit request.");
      setRequestStatus("error");
    }
  };

  return (
    <div className="absolute inset-0 z-40 bg-[#050816]/75 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none animate-fadeIn">
      <div className="max-w-md p-8 border border-red-500/30 bg-[#07111f]/90 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.15)] space-y-5">
        <div className="h-16 w-16 mx-auto rounded-full border border-red-500/40 bg-red-500/10 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.2)]">
          <Shield className="h-8 w-8 text-red-400 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold tracking-wider text-red-400 font-mono uppercase">ACCESS RESTRICTED</h3>
          <p className="text-slate-350 text-xs font-semibold font-mono leading-relaxed">
            {message}
          </p>
        </div>

        {featureKey && user && user.role !== "admin" && (
          <div className="pt-2 space-y-2">
            {requestStatus === "idle" && (
              <Button
                onClick={handleRequestAccess}
                className="w-full py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 font-bold font-mono text-[10px] tracking-widest uppercase rounded-xl transition-all"
              >
                Request Access Clearance
              </Button>
            )}
            {requestStatus === "loading" && (
              <div className="flex items-center justify-center gap-2 text-slate-400 font-mono text-[10px] tracking-wider uppercase">
                <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                <span>Transmitting Request...</span>
              </div>
            )}
            {requestStatus === "success" && (
              <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-mono text-[10px] tracking-wider uppercase font-bold bg-emerald-500/5 border border-emerald-500/20 p-2 rounded-xl">
                <Check className="h-4 w-4" />
                <span>Request Pending Admin Review</span>
              </div>
            )}
            {requestStatus === "error" && (
              <div className="space-y-2">
                <div className="text-red-400 font-mono text-[9px]">{errorMsg}</div>
                <Button
                  onClick={handleRequestAccess}
                  className="w-full py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 font-bold font-mono text-[10px] tracking-widest uppercase rounded-xl transition-all"
                >
                  Retry Request
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-red-500/20 bg-red-500/5 text-[10px] font-bold text-red-400 tracking-widest font-mono">
            <Lock className="h-3 w-3" />
            CLASS-1 RESTRICTION
          </div>
        </div>
      </div>
    </div>
  );
}
