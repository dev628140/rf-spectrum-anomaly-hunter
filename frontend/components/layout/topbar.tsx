"use client";

import {
  useEffect,
  useState
} from "react";

import {
  usePathname
} from "next/navigation";

import { useRFStore } from "@/store/rf-store";

import { useAuthStore } from "@/store/auth-store";
import {
  Activity,
  ShieldCheck,
  Cpu,
  Radio,
  Clock3,
  Database
} from "lucide-react";

const pageMeta: Record<
  string,
  {
    title: string;
    subtitle: string;
  }
> = {
  "/": {
    title: "RF Threat Intelligence Dashboard",
    subtitle: "Live RF Monitoring Console",
  },
  "/alerts": {
    title: "Threat Alerts Center",
    subtitle: "Live Incident Monitoring",
  },
  "/analytics": {
    title: "RF Analytics Console",
    subtitle: "Signal Intelligence Metrics",
  },
  "/history": {
    title: "Historical RF Analysis",
    subtitle: "Spectrum Timeline Intelligence",
  },
  "/models": {
    title: "AI Model Operations",
    subtitle: "Inference Control & Governance",
  },
  "/explain": {
    title: "Explainable AI Intelligence",
    subtitle: "Threat Reasoning Engine",
  },
  "/settings": {
    title: "System Configuration",
    subtitle: "Global Parameter Control Center",
  },
  "/users": {
    title: "User & Access Management",
    subtitle: "Operator Permission Governance",
  },
};

export function Topbar() {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();

  const { rf } = useRFStore();
  const rawStatus = rf.status.state || "NORMAL";
  const activeModel = rf.status.active_model?.replace("_", " ").toUpperCase() || "AUTOENCODER";
  
  const hasTelemetry = rf.signal?.spectrum?.length > 0;
  const rfStreamState = hasTelemetry ? "LIVE" : "OFFLINE";
  const backendState = hasTelemetry ? "ONLINE" : "OFFLINE";

  const isSecure = rawStatus === "NORMAL";
  const displayStatus = isSecure ? "SECURE" : rawStatus;

  const meta = pageMeta[pathname] || pageMeta["/"];

  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState("--:--:--");

  useEffect(() => {
    setMounted(true);
    const updateClock = () => {
      const time = new Date()
        .toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true
        })
        .toUpperCase();
      setCurrentTime(time);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="sticky top-0 z-50 border-b border-cyan-500/10 bg-[#040b16]/95 backdrop-blur-xl">
      <div className="flex items-center justify-between px-6 py-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-2.5 w-2.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_12px_rgba(74,222,128,0.9)]" />
            <h1 className="text-[1.65rem] font-black leading-none tracking-wide text-white">
              {meta.title}
            </h1>
          </div>

          <p className="mt-1 ml-5 text-[0.88rem] font-medium text-slate-400">
            {meta.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <StatusCard
            icon={<ShieldCheck className={`h-4.5 w-4.5 ${isSecure ? "text-green-400" : "text-red-400"}`} />}
            label="Threat Status"
            value={displayStatus}
            border={isSecure ? "border-green-500/20 bg-green-500/10" : "border-red-500/20 bg-red-500/10"}
            text={isSecure ? "text-green-300" : "text-red-300"}
          />

          <StatusCard
            icon={<Cpu className="h-4.5 w-4.5 text-cyan-400" />}
            label="Active Model"
            value={activeModel}
            border="border-cyan-500/20 bg-cyan-500/10"
            text="text-cyan-300"
          />

          <StatusCard
            icon={<Radio className={`h-4.5 w-4.5 ${hasTelemetry ? "text-purple-400 animate-pulse" : "text-slate-500"}`} />}
            label="RF Stream"
            value={rfStreamState}
            border={hasTelemetry ? "border-purple-500/20 bg-purple-500/10" : "border-slate-500/20 bg-slate-500/10"}
            text={hasTelemetry ? "text-purple-300" : "text-slate-300"}
          />

          <StatusCard
            icon={<Database className={`h-4.5 w-4.5 ${hasTelemetry ? "text-orange-400" : "text-slate-500"}`} />}
            label="Backend"
            value={backendState}
            border={hasTelemetry ? "border-orange-500/20 bg-orange-500/10" : "border-slate-500/20 bg-slate-500/10"}
            text={hasTelemetry ? "text-orange-300" : "text-slate-300"}
          />

          <div className="rounded-[16px] border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 min-w-[130px]">
            <div className="flex items-center gap-2.5">
              <Clock3 className="h-4.5 w-4.5 text-blue-400" />
              <div>
                <p className="text-[0.65rem] text-slate-400 leading-none">System Time</p>
                <p className="mt-0.5 text-[0.92rem] font-black text-blue-300 leading-none">
                  {mounted ? currentTime : "--:--:--"}
                </p>
              </div>
            </div>
          </div>

          {/* User profile & Log out button */}
          <div className="flex items-center gap-3 border-l border-white/10 pl-3">
            <div className="text-right shrink-0">
              <p className="text-[10px] text-slate-300 font-black leading-none">{user?.username || "Guest Operator"}</p>
              <span className={`inline-block text-[8px] font-black tracking-widest font-mono uppercase px-1.5 py-0.5 rounded-full mt-1 border ${
                user?.role === "admin" 
                  ? "border-red-500/30 bg-red-500/10 text-red-400"
                  : user?.role === "user"
                  ? "border-purple-500/30 bg-purple-500/10 text-purple-400"
                  : "border-slate-500/20 bg-slate-500/10 text-slate-400"
              }`}>
                {user?.role || "GUEST"}
              </span>
            </div>
            <button
              onClick={() => logout()}
              className="px-2.5 py-1.5 border border-cyan-500/25 hover:border-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/10 hover:text-cyan-300 text-slate-300 font-bold font-mono text-[9px] rounded-lg tracking-wider transition-all"
            >
              LOGOUT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type StatusCardProps = {
  icon:
    React.ReactNode;
  label:
    string;
  value:
    string;
  border:
    string;
  text:
    string;
};

function StatusCard({
  icon,
  label,
  value,
  border,
  text
}: StatusCardProps) {
  return (
    <div
      className={`
        rounded-[16px]
        border
        px-3
        py-1.5
        min-w-[130px]
        ${border}
      `}
    >
      <div
        className="
          flex
          items-center
          gap-2.5
        "
      >
        {icon}

        <div>
          <p
            className="
              text-[0.65rem]
              text-slate-400
              leading-none
            "
          >
            {label}
          </p>

          <p
            className={`
              mt-0.5
              text-[0.92rem]
              font-black
              leading-none
              ${text}
            `}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}