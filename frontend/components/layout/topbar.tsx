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
          px-14
          py-8
        "
      >

        <div>

          <div
            className="
              flex
              items-center
              gap-5
            "
          >

            <div
              className="
                h-6
                w-6
                rounded-full
                bg-green-400
                animate-pulse
                shadow-[0_0_25px_rgba(74,222,128,0.9)]
              "
            />

            <h1
              className="
                text-[3.5rem]
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
              mt-4
              ml-11
              text-[1.5rem]
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
            gap-6
          "
        >

          <StatusCard
            icon={
              <ShieldCheck
                className={`
                  h-9
                  w-9
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
                  h-9
                  w-9
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
                  h-9
                  w-9
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
                  h-9
                  w-9
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
              rounded-[30px]
              border
              border-blue-500/20
              bg-blue-500/10
              px-7
              py-5
              min-w-[230px]
            "
          >

            <div
              className="
                flex
                items-center
                gap-4
              "
            >

              <Clock3
                className="
                  h-9
                  w-9
                  text-blue-400
                "
              />

              <div>

                <p
                  className="
                    text-[1.1rem]
                    text-slate-400
                  "
                >
                  System Time
                </p>

                <p
                  className="
                    mt-1
                    text-[1.7rem]
                    font-black
                    text-blue-300
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
              h-20
              w-20
              items-center
              justify-center
              rounded-[28px]
              border
              border-cyan-500/20
              bg-cyan-500/10
              shadow-[0_0_30px_rgba(34,211,238,0.18)]
            "
          >

            <Activity
              className="
                h-10
                w-10
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
        rounded-[30px]
        border
        px-7
        py-5
        min-w-[240px]
        ${border}
      `}
    >

      <div
        className="
          flex
          items-center
          gap-4
        "
      >

        {icon}

        <div>

          <p
            className="
              text-[1.1rem]
              text-slate-400
            "
          >
            {label}
          </p>

          <p
            className={`
              mt-1
              text-[1.7rem]
              font-black
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