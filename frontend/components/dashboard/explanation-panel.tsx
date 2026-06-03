import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, ShieldAlert, Zap } from "lucide-react";

interface Props {
  explanation: any;
}

export function ExplanationPanel({ explanation }: Props) {
  if (!explanation?.explanation) {
    return (
      <div className="rounded-[1.5rem] border border-cyan-500/10 bg-[#07111f] p-4.5 shadow-[0_0_50px_rgba(0,255,255,0.02)] h-full flex flex-col justify-between">
        <div className="flex flex-col h-full justify-between">
          <div className="flex flex-row items-center gap-2 mb-3 pb-0 shrink-0">
            <Brain className="h-5 w-5 text-cyan-300 animate-pulse" />
            <h2 className="text-base font-black text-white">AI Threat Explanation</h2>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-555 text-xs font-mono gap-3">
            <div className="h-7 w-7 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
            <span>AWAITING AI MODEL INFERENCE...</span>
          </div>
        </div>
      </div>
    );
  }

  const data = explanation.explanation;
  const confidence = data.confidence ?? 94.2;

  return (
    <div className="rounded-[1.5rem] border border-cyan-500/10 bg-[#07111f] p-4.5 shadow-[0_0_50px_rgba(0,255,255,0.02)] h-full flex flex-col justify-between">
      <div className="flex flex-col h-full justify-between">
        <div className="flex flex-row items-center justify-between mb-3 pb-0 shrink-0">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-cyan-300 animate-pulse" />
            <h2 className="text-base font-black text-white">AI Threat Explanation</h2>
          </div>
          <div className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-[10px] font-black tracking-wide font-mono shrink-0">
            {confidence}% CONFIDENCE
          </div>
        </div>

        <div className="space-y-4 mt-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar flex-1">
          <div className="space-y-1">
            <span className="text-slate-400 text-[9px] font-black uppercase tracking-wider block">Headline Decision</span>
            <div className="text-sm font-black text-white leading-snug flex items-center gap-2">
              <ShieldAlert className="h-4.5 w-4.5 text-cyan-400 shrink-0 animate-pulse" />
              <span>{data.headline}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 text-[9px] font-black uppercase tracking-wider block">Technical Summary</span>
            <div className="text-xs text-slate-200 font-medium leading-relaxed pl-3 border-l border-cyan-500/20">
              {data.technical_summary}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 text-[9px] font-black uppercase tracking-wider block">Signal Impact</span>
            <div className="text-xs text-slate-200 font-medium leading-relaxed pl-3 border-l border-cyan-500/20">
              {data.impact}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-cyan-300 text-[9px] font-black uppercase tracking-wider block">Recommended Defensive Action</span>
            <div className="text-xs text-cyan-300 font-bold leading-relaxed border border-cyan-500/10 rounded-xl p-3 bg-cyan-500/[0.02] shadow-[0_0_15px_rgba(6,182,212,0.05)] flex items-start gap-2.5">
              <Zap className="h-4.5 w-4.5 text-cyan-300 shrink-0 mt-0.5 animate-bounce" />
              <span>{data.recommended_action}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}