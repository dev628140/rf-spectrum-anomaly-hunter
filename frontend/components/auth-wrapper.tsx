"use client";

import { useAuthStore } from "@/store/auth-store";
import LoginPage from "@/components/login-page";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useEffect, useState } from "react";

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized, initialize } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    initialize();
    setMounted(true);
  }, [initialize]);

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
