import "./globals.css";
import { Providers } from "@/components/providers";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export const metadata = {
  title: "RF Intelligence Dashboard",
  description: "Real-time RF threat intelligence platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#050816] text-white antialiased overflow-hidden">
        <Providers>
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
        </Providers>
      </body>
    </html>
  );
}