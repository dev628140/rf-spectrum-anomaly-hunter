"use client";

import {
  useEffect,
  useState
} from "react";

import {
  usePathname
} from "next/navigation";

import { useRFStore } from "@/store/rf-store";

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

    title:
      "RF Threat Intelligence Dashboard",

    subtitle:
      "Live RF Monitoring Console",
  },

  "/alerts": {

    title:
      "Threat Alerts Center",

    subtitle:
      "Live Incident Monitoring",
  },

  "/analytics": {

    title:
      "RF Analytics Console",

    subtitle:
      "Signal Intelligence Metrics",
  },

  "/history": {

    title:
      "Historical RF Analysis",

    subtitle:
      "Spectrum Timeline Intelligence",
  },

  "/models": {

    title:
      "AI Model Operations",

    subtitle:
      "Inference Control & Governance",
  },

  "/explain": {

    title:
      "Explainable AI Intelligence",

    subtitle:
      "Threat Reasoning Engine",
  },

  "/settings": {

    title:
      "System Configuration",

    subtitle:
      "Global Parameter Control Center",
  },

  "/users": {

    title:
      "User & Access Management",

    subtitle:
      "Operator Permission Governance",
  },
};

export function Topbar() {

  const pathname =
    usePathname();

  const { rf } = useRFStore();
  const rawStatus = rf.status.state || "NORMAL";
  const activeModel = rf.status.active_model?.replace("_", " ").toUpperCase() || "AUTOENCODER";
  
  const hasTelemetry = rf.signal?.spectrum?.length > 0;
  const rfStreamState = hasTelemetry ? "LIVE" : "OFFLINE";
  const backendState = hasTelemetry ? "ONLINE" : "OFFLINE";

  const isSecure = rawStatus === "NORMAL";
  const displayStatus = isSecure ? "SECURE" : rawStatus;

  const meta =
    pageMeta[pathname] ||
    pageMeta["/"];

  const [
    mounted,
    setMounted
  ] = useState(false);

  const [
    currentTime,
    setCurrentTime
  ] = useState(
    "--:--:--"
  );

  useEffect(() => {

    setMounted(true);

    const updateClock = () => {

      const time =
        new Date()
          .toLocaleTimeString(
            "en-US",
            {
              hour:
                "2-digit",

              minute:
                "2-digit",

              second:
                "2-digit",

              hour12:
                true
            }
          )
          .toUpperCase();

      setCurrentTime(
        time
      );
    };

    updateClock();

    const interval =
      setInterval(
        updateClock,
        1000
      );

    return () =>
      clearInterval(
        interval
      );

  }, []);

  return (
    <div
      className="
        sticky
        top-0
        z-50
        border-b
        border-cyan-500/10
        bg-[#040b16]/95
        backdrop-blur-xl
      "
    >
      <div
        className="
          flex
          items-center
          justify-between
          px-8
          py-4
        "
      >
        <div>
          <div
            className="
              flex
              items-center
              gap-3
            "
          >
            <div
              className="
                h-3
                w-3
                rounded-full
                bg-green-400
                animate-pulse
                shadow-[0_0_15px_rgba(74,222,128,0.9)]
              "
            />

            <h1
              className="
                text-[2.2rem]
                font-black
                leading-none
                tracking-wide
                text-white
              "
            >
              {meta.title}
            </h1>
          </div>

          <p
            className="
              mt-1.5
              ml-6
              text-[1.05rem]
              font-medium
              text-slate-400
            "
          >
            {meta.subtitle}
          </p>
        </div>

        <div
          className="
            flex
            items-center
            gap-4
          "
        >
          <StatusCard
            icon={
              <ShieldCheck
                className={`
                  h-6
                  w-6
                  ${isSecure ? "text-green-400" : "text-red-400"}
                `}
              />
            }
            label="Threat Status"
            value={displayStatus}
            border={
              isSecure
                ? "border-green-500/20 bg-green-500/10"
                : "border-red-500/20 bg-red-500/10"
            }
            text={
              isSecure
                ? "text-green-300"
                : "text-red-300"
            }
          />

          <StatusCard
            icon={
              <Cpu
                className="
                  h-6
                  w-6
                  text-cyan-400
                "
              />
            }
            label="Active Model"
            value={activeModel}
            border="
              border-cyan-500/20
              bg-cyan-500/10
            "
            text="
              text-cyan-300
            "
          />

          <StatusCard
            icon={
              <Radio
                className={`
                  h-6
                  w-6
                  ${hasTelemetry ? "text-purple-400 animate-pulse" : "text-slate-500"}
                `}
              />
            }
            label="RF Stream"
            value={rfStreamState}
            border={
              hasTelemetry
                ? "border-purple-500/20 bg-purple-500/10"
                : "border-slate-500/20 bg-slate-500/10"
            }
            text={
              hasTelemetry
                ? "text-purple-300"
                : "text-slate-300"
            }
          />

          <StatusCard
            icon={
              <Database
                className={`
                  h-6
                  w-6
                  ${hasTelemetry ? "text-orange-400" : "text-slate-500"}
                `}
              />
            }
            label="Backend"
            value={backendState}
            border={
              hasTelemetry
                ? "border-orange-500/20 bg-orange-500/10"
                : "border-slate-500/20 bg-slate-500/10"
            }
            text={
              hasTelemetry
                ? "text-orange-300"
                : "text-slate-300"
            }
          />

          <div
            className="
              rounded-[20px]
              border
              border-blue-500/20
              bg-blue-500/10
              px-4
              py-2.5
              min-w-[160px]
            "
          >
            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              <Clock3
                className="
                  h-6
                  w-6
                  text-blue-400
                "
              />

              <div>
                <p
                  className="
                    text-[0.75rem]
                    text-slate-400
                    leading-none
                  "
                >
                  System Time
                </p>

                <p
                  className="
                    mt-1
                    text-[1.1rem]
                    font-black
                    text-blue-300
                    leading-none
                  "
                >
                  {
                    mounted
                      ? currentTime
                      : "--:--:--"
                  }
                </p>
              </div>
            </div>
          </div>

          <div
            className="
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-2xl
              border
              border-cyan-500/20
              bg-cyan-500/10
              shadow-[0_0_20px_rgba(34,211,238,0.15)]
              shrink-0
            "
          >
            <Activity
              className="
                h-6
                w-6
                text-cyan-300
              "
            />
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
        rounded-[20px]
        border
        px-4
        py-2.5
        min-w-[160px]
        ${border}
      `}
    >
      <div
        className="
          flex
          items-center
          gap-3
        "
      >
        {icon}

        <div>
          <p
            className="
              text-[0.75rem]
              text-slate-400
              leading-none
            "
          >
            {label}
          </p>

          <p
            className={`
              mt-1
              text-[1.1rem]
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