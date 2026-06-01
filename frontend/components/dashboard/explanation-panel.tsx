import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, ShieldAlert, Zap } from "lucide-react";

interface Props {
  explanation: any;
}

export function ExplanationPanel({ explanation }: Props) {
  if (!explanation?.explanation) return null;

  const data = explanation.explanation;
  const confidence = data.confidence ?? 94.2;

  return (
    <Card className="p-8 border-cyan-500/10 bg-[#07111f] flex flex-col justify-between shadow-[0_0_50px_rgba(0,255,255,0.02)] h-[650px] rounded-[2rem]">
      <div className="flex flex-col h-full justify-between">
        <CardHeader className="flex flex-row items-center justify-between mb-6 pb-0 shrink-0">
          <div className="flex items-center gap-4">
            <Brain className="h-9 w-9 text-cyan-300 animate-pulse" />
            <CardTitle className="text-4xl font-black text-white">AI Threat Explanation</CardTitle>
          </div>
          <div className="px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-base font-black tracking-wide font-mono shrink-0">
            {confidence}% CONFIDENCE
          </div>
        </CardHeader>

        <CardContent className="space-y-6 mt-4 max-h-[460px] overflow-y-auto pr-2 custom-scrollbar flex-1">
          <div className="space-y-2">
            <span className="text-slate-300 text-sm font-black uppercase tracking-wider block">Headline Decision</span>
            <div className="text-3xl font-black text-white leading-snug flex items-center gap-3">
              <ShieldAlert className="h-7 w-7 text-cyan-400 shrink-0 animate-pulse" />
              <span>{data.headline}</span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-slate-300 text-sm font-black uppercase tracking-wider block">Technical Summary</span>
            <div className="text-xl text-slate-200 font-medium leading-relaxed pl-6 border-l-2 border-cyan-500/20">
              {data.technical_summary}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-slate-300 text-sm font-black uppercase tracking-wider block">Signal Impact</span>
            <div className="text-xl text-slate-200 font-medium leading-relaxed pl-6 border-l-2 border-cyan-500/20">
              {data.impact}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-cyan-300 text-sm font-black uppercase tracking-wider block">Recommended Defensive Action</span>
            <div className="text-xl text-cyan-300 font-black leading-relaxed border border-cyan-500/10 rounded-2xl p-6 bg-cyan-500/[0.02] shadow-[0_0_20px_rgba(6,182,212,0.05)] flex items-start gap-4">
              <Zap className="h-6 w-6 text-cyan-300 shrink-0 mt-1 animate-bounce" />
              <span>{data.recommended_action}</span>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}