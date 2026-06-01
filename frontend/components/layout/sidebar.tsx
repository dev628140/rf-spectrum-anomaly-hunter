"use client";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  History,
  Cpu,
  Shield,
  Radio,
  Settings,
  Users
} from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  {
    label: "Live RF",
    subtitle: "Live Monitoring",
    icon: Activity,
    href: "/",
    color:
      "from-cyan-500/20 to-blue-500/20 border-cyan-500/40 text-cyan-300",
  },

  {
    label: "Alerts",
    subtitle: "Incident Center",
    icon: AlertTriangle,
    href: "/alerts",
    color:
      "from-orange-500/20 to-red-500/20 border-orange-500/40 text-orange-300",
  },

  {
    label: "Analytics",
    subtitle: "Signal Metrics",
    icon: BarChart3,
    href: "/analytics",
    color:
      "from-violet-500/20 to-fuchsia-500/20 border-violet-500/40 text-violet-300",
  },

  {
    label: "History",
    subtitle: "Timeline Analysis",
    icon: History,
    href: "/history",
    color:
      "from-green-500/20 to-emerald-500/20 border-green-500/40 text-green-300",
  },

  {
    label: "Models",
    subtitle: "AI Model Ops",
    icon: Cpu,
    href: "/models",
    color:
      "from-blue-500/20 to-indigo-500/20 border-blue-500/40 text-blue-300",
  },

  {
    label: "Explain AI",
    subtitle: "AI Reasoning",
    icon: Brain,
    href: "/explain",
    color:
      "from-purple-500/20 to-pink-500/20 border-purple-500/40 text-purple-300",
  },

  {
    label: "Settings",
    subtitle: "System Config",
    icon: Settings,
    href: "/settings",
    color:
      "from-yellow-500/20 to-amber-500/20 border-yellow-500/40 text-yellow-300",
  },

  {
    label: "Users",
    subtitle: "Access Control",
    icon: Users,
    href: "/users",
    color:
      "from-teal-500/20 to-emerald-500/20 border-teal-500/40 text-teal-300",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="
        w-[360px]
        min-h-screen
        border-r
        border-cyan-500/10
        bg-[#050816]
        relative
        overflow-hidden
      "
    >
      {/* Background Glow */}
      <div
        className="
          absolute
          inset-0
          bg-[radial-gradient(circle_at_top_left,rgba(0,255,255,0.08),transparent_35%)]
          pointer-events-none
        "
      />

      <div
        className="
          relative
          z-10
          flex
          flex-col
          justify-between
          h-full
          px-7
          py-8
        "
      >
        {/* Top Section */}
        <div>
          {/* Branding */}
          <div className="flex items-start gap-5 mb-12">
            <div
              className="
                h-16
                w-16
                rounded-2xl
                border
                border-cyan-500/40
                bg-cyan-500/10
                flex
                items-center
                justify-center
                shadow-[0_0_25px_rgba(0,255,255,0.15)]
              "
            >
              <Shield className="h-9 w-9 text-cyan-300" />
            </div>

            <div className="flex flex-col justify-center">
              <div
                className="
                  text-[2.45rem]
                  font-black
                  leading-[0.95]
                  tracking-tight
                  text-white
                "
              >
                RF
                <br />
                INTEL
              </div>

              <div
                className="
                  text-[1.22rem]
                  text-cyan-200/80
                  leading-[1.25]
                  mt-3
                  font-semibold
                "
              >
                Threat Intelligence
                <br />
                Platform
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-5">
            {items.map((item) => {
              const Icon = item.icon;

              const active =
                pathname === item.href;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                >
                  <div
                    className={`
                      group
                      rounded-3xl
                      border
                      transition-all
                      duration-300
                      px-7
                      py-6
                      flex
                      items-center
                      gap-5
                      cursor-pointer

                      ${
                        active
                          ? `
                            bg-gradient-to-r
                            ${item.color}
                            shadow-[0_0_35px_rgba(0,255,255,0.18)]
                          `
                          : `
                            border-white/5
                            bg-white/[0.02]
                            hover:bg-white/[0.05]
                            hover:border-cyan-500/20
                          `
                      }
                    `}
                  >
                    {/* Icon */}
                    <div
                      className={`
                        h-16
                        w-16
                        rounded-2xl
                        flex
                        items-center
                        justify-center
                        border

                        ${
                          active
                            ? "border-white/20 bg-white/10"
                            : "border-white/10 bg-white/[0.03]"
                        }
                      `}
                    >
                      <Icon
                        className={`
                          h-9
                          w-9
                          ${
                            active
                              ? "text-white"
                              : "text-slate-300"
                          }
                        `}
                      />
                    </div>

                    {/* Text */}
                    <div className="flex flex-col">
                      <span
                        className={`
                          text-[1.9rem]
                          font-bold
                          leading-none

                          ${
                            active
                              ? "text-white"
                              : "text-slate-100"
                          }
                        `}
                      >
                        {item.label}
                      </span>

                      <span
                        className="
                          text-[1.3rem]
                          mt-2
                          font-medium
                          leading-tight
                          text-slate-400
                        "
                      >
                        {item.subtitle}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom Status */}
        <div
          className="
            rounded-3xl
            border
            border-cyan-500/10
            bg-white/[0.02]
            p-7
            mt-10
          "
        >
          <div
            className="
              text-[1.4rem]
              font-bold
              text-emerald-300
              tracking-wide
            "
          >
            ALL SYSTEMS
            <br />
            OPERATIONAL
          </div>

          <div
            className="
              text-[1.05rem]
              text-slate-500
              mt-3
              font-medium
            "
          >
            Version 1.0.0
          </div>

          <div
            className="
              mt-8
              flex
              items-center
              justify-between
            "
          >
            <div>
              <div
                className="
                  text-[1.4rem]
                  font-bold
                  text-cyan-300
                "
              >
                ACTIVE
              </div>

              <div
                className="
                  text-[1rem]
                  text-slate-500
                  mt-1
                "
              >
                RF Stream
              </div>
            </div>

            <Radio className="h-8 w-8 text-cyan-300 animate-pulse" />
          </div>
        </div>
      </div>
    </aside>
  );
}