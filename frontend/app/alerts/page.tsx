"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { IncidentFeed } from "@/components/dashboard/incident-feed";
import { useIncidents } from "@/hooks/use-history";

export default function AlertsPage() {
  const incidents = useIncidents();

  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar />

      <main className="flex-1">
        <Topbar />

        <div className="p-12">
          <IncidentFeed incidents={incidents.data} />
        </div>
      </main>
    </div>
  );
}