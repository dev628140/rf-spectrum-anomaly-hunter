"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { ModelControl } from "@/components/models/model-control";

export default function ModelsPage() {
  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar />

      <main className="flex-1">
        <Topbar />

        <div className="p-6">
          <ModelControl />
        </div>
      </main>
    </div>
  );
}