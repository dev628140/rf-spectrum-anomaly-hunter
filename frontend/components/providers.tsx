"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { useLiveRF } from "@/hooks/use-live-rf";

function TelemetryStreamer() {
  useLiveRF();
  return null;
}

export function Providers({
  children,
}: {
  children: ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchInterval: 3000,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TelemetryStreamer />
      {children}
    </QueryClientProvider>
  );
}