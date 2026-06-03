"use client";

import { Shield, Lock } from "lucide-react";

export function RestrictedOverlay({ message = "Root-level clearance required." }: { message?: string }) {
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
