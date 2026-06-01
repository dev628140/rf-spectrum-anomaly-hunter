import "./globals.css";
import { Providers } from "@/components/providers";

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
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}