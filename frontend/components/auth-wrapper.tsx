"use client";

import { useAuthStore } from "@/store/auth-store";
import LoginPage from "@/components/login-page";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isInitialized, initialize, updateUserLocal } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    initialize();
    setMounted(true);
  }, [initialize]);

  useEffect(() => {
    if (!isAuthenticated || !user || user.role === "guest") return;

    const syncProfile = async () => {
      try {
        const res = await api.get("/api/system/operators");
        if (res.data && res.data.status === "SUCCESS") {
          const currentOps = res.data.data;
          const myOp = currentOps.find((o: any) => o.username === user.username);
          if (myOp) {
            if (
              myOp.scope !== user.scope ||
              myOp.name !== user.name ||
              myOp.level !== user.level ||
              myOp.avatar !== user.avatar ||
              myOp.color !== user.color
            ) {
              updateUserLocal({
                name: myOp.name,
                scope: myOp.scope,
                level: myOp.level,
                avatar: myOp.avatar,
                color: myOp.color
              });
            }
          }
        }
      } catch (err) {
        console.error("Failed to sync operator profile:", err);
      }
    };

    syncProfile();
    const interval = setInterval(syncProfile, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user?.username, user?.scope, user?.name, user?.level, user?.avatar, user?.color, updateUserLocal]);

  if (!mounted || !isInitialized) {
    return (
      <div className="flex h-screen w-screen bg-[#050816] items-center justify-center font-mono text-cyan-300">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 border-4 border-cyan-500 border-t-transparent animate-spin rounded-full mx-auto" />
          <p className="text-sm font-bold tracking-widest animate-pulse uppercase">BOOTING SECURE OPERATIONS NODE PERSISTENCE...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#050816]">
      {/* Permanent Sidebar (never unmounts during navigation) */}
      <Sidebar />

      {/* Main application panel */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Dynamic Header */}
        <Topbar />

        {/* Dynamic Page content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}
